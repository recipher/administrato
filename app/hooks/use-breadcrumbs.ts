import { useLocation, useMatches } from "@remix-run/react";

export default () => {
  const location = useLocation();

  return useMatches()
    .filter(match => match.handle && match.handle.breadcrumb && match.handle.name)
    .map(match => {
      const current = match.pathname === location.pathname;
      return match.handle?.breadcrumb({ current, ...match.data, name: match.handle.name({ ...match.data }) });
    })
    .flat();
};