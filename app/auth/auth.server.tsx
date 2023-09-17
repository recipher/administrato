import { createCookieSessionStorage } from "@remix-run/node";
import { Authenticator } from "remix-auth";
import { Auth0Strategy } from "remix-auth-auth0";

import {
  AUTH0_CALLBACK_URL,
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_DOMAIN,
  SESSION_SECRET,
  NODE_ENV,
} from "./settings.server";

// const isDevelopment = NODE_ENV === "development";
const isProduction = NODE_ENV === "production";

const DOMAIN = "recipher.co.uk";
const DOMAINS = new Map<string, string>(
  [ "manage", "scheduler", "security" ].map(d => [ `${d}.${DOMAIN}`, d ])
);

enum Right {
  read = 1,
  create = 2,
  edit = 4,
  delete = 8,
};

export type SecurityKey = {
  keyStart: number;
  keyEnd: number;
};

export type KeySet = {
  client: Array<SecurityKey>,
  serviceCentre: Array<SecurityKey>,
  legalEntity: Array<SecurityKey>,
  provider: Array<SecurityKey>,
};

export type Organization = {
  auth0id: string;
  id: string;
  displayName: string;
  name: string;
  keys: KeySet;
};

export type User = {
  id: string;
  name: string;
  email: string;
  picture: string;
  permissions: Array<string>;
  settings: any;
  organizations: Array<Organization>;
  keys: KeySet,
  defaultKeys: Array<SecurityKey>;
  organization: Organization;
  impersonator?: { id: string; name: string };
};

const mapKeys = (profile: any, organisation: string) => {
  if (profile === undefined) return;
  type ObjectKey = keyof typeof profile;
  const key = `https://${DOMAIN}/metadata` as ObjectKey;
  const metadata = profile[key] as any;
  const keys = metadata?.keys[organisation];
 
  if (keys === undefined) return [];

  Object.keys(keys).forEach(k => {
    keys[k] = keys[k].map((key: Array<[number, number]>) => {
      const [ keyStart, keyEnd ] = key;
      return { keyStart, keyEnd};
    });
  });

  return keys;
};

const mapSettings = (profile: any) => {
  if (profile === undefined) return;
  type ObjectKey = keyof typeof profile;
  const key = `https://${DOMAIN}/settings` as ObjectKey;
  return profile[key] as any;
};

const mapOrganizations = (profile: any) => {
  if (profile === undefined) return;
  type ObjectKey = keyof typeof profile;
  const key = `https://${DOMAIN}/organizations` as ObjectKey;
  const organizations = profile[key] as Array<any>;
  return organizations.map(o => ({
    auth0id: o.id,
    name: o.name,
    displayName: o.display_name,
    id: o.metadata.id,
    keys: mapKeys(profile, o.id),
  }));
};

const compact = (permissions?: Array<string>) => {
  return permissions?.reduce((namespaces: Array<string>, permission: string) => {
    const [ ns, _, entity ] = permission.split(":");
    return namespaces.includes(`${ns}:${entity}`) ? namespaces : [ `${ns}:${entity}`, ...namespaces ];
  }, []).map((namespace: string) => {
    const rights = permissions.filter(permission => {
      const [ ns, _, entity ] = permission.split(":");
      return `${ns}:${entity}` === namespace;
    }).map(permission => {
      const [ _, right ] = permission.split(":");
      return Object.values(Right)[Object.keys(Right).indexOf(right)] as number;
    }).reduce((rights: number, right: number) => rights + right, 0);

    return `${namespace}:${rights}`;
  });
};

const expand = (permissions: Array<string>) => {
  return permissions.map((permission: string) => {
    const [ ns, entity, right ] = permission.split(':');

    return Object.values(Right).filter(r => !isNaN(Number(r))).map((r: any) => {
      const bit = parseInt(r);
      return (parseInt(right) & bit) === bit ? bit : 0;
    }).map((r: number) => {
      const right = r === 0 ? undefined : Object.keys(Right)[Object.values(Right).indexOf(r)];
      if (right !== undefined) return `${ns}:${right}:${entity}`;
    });
  }).flat().reduce((permissions: Array<string>, permission) => 
    permission === undefined ? permissions : [ permission, ...permissions ],
  []);
};

const mapPermissions = (profile: any) => {
  if (profile === undefined) return;
  type ObjectKey = keyof typeof profile;
  let permissions = new Array<string>();
  DOMAINS.forEach((name: string, domain: string) => {
    const key = `https://${domain}/permissions` as ObjectKey;
    const perms = profile && profile[key] as Array<string>;
    if (perms) permissions = [ ...permissions, ...perms.map((p: string) => `${name}:${p}`) ];
  });

  return compact(permissions);
};

export const fromCookie = (user: User) => 
  ({ ...user, permissions: expand(user.permissions) });

export const mapProfileToUser = (id: string | undefined, profile: any) => {
  if (id === undefined) return;
  const 
    name = profile?.name, 
    email = profile?.email, 
    picture = profile?.picture,
    orgId = profile?.org_id,
    settings = mapSettings(profile),
    permissions = mapPermissions(profile),
    defaultKeys = mapKeys(profile, "default"),
    organizations = mapOrganizations(profile),
    organization = organizations?.find(o => o.auth0id === settings?.organization || orgId),
    keys = organization?.keys === undefined ? defaultKeys : organization.keys;

  return { 
    id, 
    name, 
    email, 
    picture, 
    settings, 
    permissions, 
    organizations: organizations?.map(o => ({ ...o, keys: undefined })), 
    organization, 
    keys, 
    defaultKeys 
  };
};

export const storage = createCookieSessionStorage({
  cookie: {
    name: "_remix_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [SESSION_SECRET],
    secure: isProduction,
  },
});

export const auth = new Authenticator<any>(storage);

export const requireUser = async (request: Request) => {
  const user = await auth.isAuthenticated(request, { failureRedirect: "/denied" });
  return fromCookie(user);
};

export const authenticate = async (strategy: string, request: Request) => {
  const user = await auth.authenticate("auth0", request);
  return fromCookie(user);
};

const auth0Strategy = new Auth0Strategy(
  {
    callbackURL: AUTH0_CALLBACK_URL,
    clientID: AUTH0_CLIENT_ID,
    clientSecret: AUTH0_CLIENT_SECRET,
    domain: AUTH0_DOMAIN,
  },
  async ({ profile }) => mapProfileToUser(profile.id, profile._json)
);

auth.use(auth0Strategy);

export const { getSession, commitSession, destroySession } = storage;
