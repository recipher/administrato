import Error from "~/pages/error";

export default function Denied() {
  return (
    <Error code={403} message="Access Denied" error="You do not have permission to access this resource" />
  );
};