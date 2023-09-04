import { createCookieSessionStorage } from "@remix-run/node";

const secret = process.env.SESSION_SECRET || "";

export type FlashMessage = {
  level: string;
  text: string;
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

export async function getSessionFlash(request: Request) {
  const session = await getSession(request);

  const flash: FlashMessage = {
    level: session.get("flashLevel"),
    text: session.get("flashText"),
  };
  if (!flash.text) return null;

  const headers = { "Set-Cookie": await storage.commitSession(session) };

  return { flash, headers };
};