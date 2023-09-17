import { useLocation, useMatches } from "@remix-run/react";

export type HelpFile = {
  identifier: string;
  current: boolean;
};

export default () => {
  const location = useLocation();

  return useMatches()
    .filter(match => match.handle?.help)
    .map(match => {
      const current = match.pathname === location.pathname;
      return { identifier: match.handle?.help, current };
    })
    .flat();
};