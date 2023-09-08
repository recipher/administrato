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
const isProduction = NODE_ENV === "production";

const DOMAIN = "recipher.co.uk";
const DOMAINS = new Map<string, string>(
  [ "manage", "scheduler", "security" ].map(d => [ `${d}.${DOMAIN}`, d ])
);

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

export const requireUser = async (request: Request) =>
  auth.isAuthenticated(request, { failureRedirect: "/" });

export type SecurityKey = {
  keyStart: number;
  keyEnd: number;
};

export type Organization = {
  auth0id: string;
  id: string;
  displayName: string;
  name: string;
  keys: Array<SecurityKey>;
};

export type User = {
  id: string;
  name: string;
  email: string;
  picture: string;
  permissions: Array<string>;
  settings: any;
  organizations: Array<Organization>;
  keys: Array<SecurityKey>;
  defaultKeys: Array<SecurityKey>;
  organization: Organization;
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

const mapPermissions = (profile: any) => {
  if (profile === undefined) return;
  type ObjectKey = keyof typeof profile;
  let permissions = new Array<string>();
  DOMAINS.forEach((name: string, domain: string) => {
    const key = `https://${domain}/permissions` as ObjectKey;
    const perms = profile && profile[key] as Array<string>;
    if (perms) permissions = [ ...permissions, ...perms.map((p: any) => `${name}:${p}`) ];
  });
  return permissions;
};

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

  return { id, name, email, picture, settings, permissions, organizations, organization, keys, defaultKeys };
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
