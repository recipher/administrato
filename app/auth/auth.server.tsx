import { createCookieSessionStorage } from "@remix-run/node";
import { Authenticator } from "remix-auth";
import type { Auth0Profile } from "remix-auth-auth0";
import { Auth0Strategy } from "remix-auth-auth0";

import {
  AUTH0_CALLBACK_URL,
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_DOMAIN,
  SESSION_SECRET,
  NODE_ENV,
} from "./settings.server";

const isDevelopment = NODE_ENV === "development";

const DOMAIN = "recipher.co.uk";
const DOMAINS = new Map<string, string>(
  [ "manage", "scheduler", "security" ].map(d => [ `${d}.${DOMAIN}`, d ])
);

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_remix_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export const auth = new Authenticator<Auth0Profile>(sessionStorage);

export const requireProfile = async (request: Request) => {
  const profile = await auth.isAuthenticated(request, { failureRedirect: "/" });
  return mapProfileToUser(profile);
};

export type Profile = Auth0Profile;
export type SecurityKey = {
  keyStart: number;
  keyEnd: number;
};
export type Organization = {
  auth0id: string;
  id: string;
  displayName: string;
  name: string;
  active: boolean;
  keys: Array<SecurityKey>;
};

export type User = {
  name: string;
  email: string;
  picture: string;
  permissions: Array<string>;
  organizations: Array<Organization>;
  keys: Array<SecurityKey>;
  defaultKeys: Array<SecurityKey>;
  organization: Organization;
};

const mapKeys = (profile: Profile, organisation: string) => {
  if (profile._json === undefined) return;
  type ObjectKey = keyof typeof profile._json;
  const key = `https://${DOMAIN}/metadata` as ObjectKey;
  const metadata = profile._json[key] as any;
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

const mapOrganizations = (profile: Profile) => {
  if (profile._json === undefined) return;
  type ObjectKey = keyof typeof profile._json;
  const key = `https://${DOMAIN}/organizations` as ObjectKey;
  const organizations = profile._json[key] as Array<any>;
  return organizations.map(o => ({
    auth0id: o.id,
    name: o.name,
    displayName: o.display_name,
    id: o.metadata.id,
    active: o.id === profile._json?.org_id,
    keys: mapKeys(profile, o.id),
  }));
};

const mapPermissions = (profile: Profile) => {
  if (profile._json === undefined) return;
  type ObjectKey = keyof typeof profile._json;
  let permissions = new Array<string>();
  DOMAINS.forEach((name: string, domain: string) => {
    const key = `https://${domain}/permissions` as ObjectKey;
    const perms = profile._json && profile._json[key] as Array<string>;
    if (perms) permissions = [ ...permissions, ...perms.map(p => `${name}:${p}`) ];
  });
  return permissions;
};

export const mapProfileToUser = (profile: Profile) => {
  const 
    name = profile._json?.name, 
    email = profile._json?.email, 
    picture = profile._json?.picture,
    permissions = mapPermissions(profile),
    defaultKeys = mapKeys(profile, "default"),
    organizations = mapOrganizations(profile),
    organization = organizations?.find(o => o.active === false),
    keys = organization?.keys === undefined ? defaultKeys : organization.keys;

  return { name, email, picture, permissions, organizations, organization, keys, defaultKeys };
};

const auth0Strategy = new Auth0Strategy(
  {
    callbackURL: AUTH0_CALLBACK_URL,
    clientID: AUTH0_CLIENT_ID,
    clientSecret: AUTH0_CLIENT_SECRET,
    domain: AUTH0_DOMAIN,
  },
  async ({ profile }) => profile
);

auth.use(auth0Strategy);

export const { getSession, commitSession, destroySession } = sessionStorage;
