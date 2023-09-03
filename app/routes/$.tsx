import NotFound from "~/pages/404";

import type { V2_MetaFunction } from "@remix-run/node";

export const meta: V2_MetaFunction = () => [{ title: "Not Found" }];

export default function Index() {
  return NotFound();
}
