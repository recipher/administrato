import { json } from "@remix-run/node";

export const notFound = (message: string) => json({ message }, { status: 404 });
export const badRequest = (message: string) => json({ message }, { status: 400 });
