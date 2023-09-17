import { getSession, mapProfileToUser, storage } from "./auth.server";
import UserService from "~/models/access/users.server";

export default async ({ id, request, headers }: { id: string, request: Request, headers?: Headers }) => {
  if (headers === undefined) headers = new Headers();
  const service = UserService();
  const session = await getSession(request.headers.get("Cookie"));
  const profile = await service.getTokenizedUser({ id });
  session.set("user", mapProfileToUser(id, profile));
  headers.append("Set-Cookie", await storage.commitSession(session));
  return headers;
};