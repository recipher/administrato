import { useLocation, useMatches } from "@remix-run/react";

export default () => {
  const location = useLocation();

  return useMatches()
    .filter(match => match.handle && match.handle.breadcrumb)
    .map(match => {
      const current = match.pathname === location.pathname;
      return match.handle?.breadcrumb({ current, ...match.data });
    })
    .flat();
};