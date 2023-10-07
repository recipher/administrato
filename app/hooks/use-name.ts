import { useMatches } from "@remix-run/react";

export default () => {
  return useMatches()
    .filter(match => match.handle && match.handle.name)
    .map(match => typeof match.handle?.name === 'function' ? match.handle?.name({ ...match.data }) : match.handle?.name)
    .flat();
};