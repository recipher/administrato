import { Link } from "@remix-run/react";

import Button, { type ButtonProps } from './button';
import { useUser } from "~/hooks";

type Action = ButtonProps & { to?: string, href?: string; download?: string; default?: boolean };
export type ActionsProps = Array<Action>;

type Props = {
  actions: ActionsProps,
};

export default function Actions({ actions = [] }: Props) {
  const { permissions } = useUser();

  const filter = (items: ActionsProps) => {
    return items.filter(({ permission, hidden }: Action) => {
      if (permission === undefined) return !hidden;
      return permissions.includes(permission) && !hidden;
    });
  };

  return (
    filter(actions).map(action =>
      <span key={action.title} className="ml-3">
        {action.to === undefined
          ? action.href === undefined
            ? <Button {...action} key={action.title} />
            : <a href={action.href} key={action.title} download={action.download}>
                <Button {...action} />
              </a>
          : <Link to={action.to} key={action.title}><Button {...action} /></Link>}
      </span>
  ));
};
