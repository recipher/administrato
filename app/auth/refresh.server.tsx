import { getSession, mapProfileToUser, storage } from "./auth.server";
import UserService from "~/services/access/users.server";

export default async ({ id, request, headers }: { id: string, request: Request, headers?: Headers }) => {
  if (headers === undefined) headers = new Headers();

  const service = UserService();
  const session = await getSession(request.headers.get("Cookie"));
  const profile = await service.getTokenizedUser({ id });
  const impersonator = session.get("user").impersonator;

  session.set("user", { ...mapProfileToUser(id, profile), impersonator: impersonator?.id === id ? undefined : impersonator });
  headers.append("Set-Cookie", await storage.commitSession(session));
  return headers;
};
