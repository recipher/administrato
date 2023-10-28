import { useMatches } from "@remix-run/react";

export default () => {
  return useMatches()
    .filter(match => match.handle && match.handle.path)
    .map(match => typeof match.handle?.name === 'function' ? match.handle?.path({ ...match.data }) : match.handle?.path)
    .flat();
};