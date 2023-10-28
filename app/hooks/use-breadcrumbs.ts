import { useLocation, useMatches } from "@remix-run/react";

export default () => {
  const location = useLocation();
  
  return useMatches()
    .filter(match => match.handle && match.handle.breadcrumb && match.handle.name)
    .map(match => {
      const current = match.pathname === location.pathname;
      return match.handle?.breadcrumb({ 
        current, ...match.data, 
        name: typeof match.handle?.name === 'function' 
          ? match.handle.name({ ...match.data })
          : match.handle.name,
        path: typeof match.handle?.path === 'function' 
          ? match.handle.path({ ...match.data })
          : match.handle.path,
      })
    })
    .flat();
};