import type { V2_MetaFunction } from "@remix-run/node";
// import { Link } from "@remix-run/react";

// import { useOptionalUser } from "~/utils";

export const meta: V2_MetaFunction = () => [{ title: "Scheduler" }];

export default function Index() {
  // const user = useOptionalUser();
  return (
    <main className="">
      Hello
    </main>
  );
}
