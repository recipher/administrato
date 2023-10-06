import { useMatches } from "@remix-run/react";

export default () => {
  return useMatches()
    .filter(match => match.handle && match.handle.name)
    .map(match => match.handle?.name({ ...match.data }))
    .flat();
};