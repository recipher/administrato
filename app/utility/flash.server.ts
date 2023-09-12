import { createCookieSessionStorage } from "@remix-run/node";

import { Level } from '~/components/toast';

const secret = process.env.SESSION_SECRET || "";

export type FlashMessage = {
  level?: Level;
  message?: string;
};

// Create a minimal cookie sesssion
export const storage = createCookieSessionStorage({
  cookie: {
    name: "session-flash__session",
    secrets: [ secret ],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export async function getSession(request: Request) {
  return await storage.getSession(request.headers.get("Cookie"));
};

export async function setFlashMessage({ request, message = "", level = Level.Info }: { request: Request } & FlashMessage) {
  const session = await getSession(request);
  session.flash("flash:message", message);
  session.flash("flash:level", level);
  return session;
};

export async function getSessionFlash(request: Request, headers: Headers) {
  if (!headers) headers = new Headers();
  const session = await getSession(request);

  const flash: FlashMessage = {
    level: session.get("flash:level"),
    message: session.get("flash:message"),
  };
  if (!flash.message) return { headers };

  headers.append("Set-Cookie", await storage.commitSession(session));

  return { flash, headers };
};