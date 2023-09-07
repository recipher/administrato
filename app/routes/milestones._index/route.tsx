import type { V2_MetaFunction } from "@remix-run/node";

export const meta: V2_MetaFunction = () => [{ title: "Scheduler" }];

export default function Index() {
  return (
    <div className="">
      Milestones
    </div>
  );
}
