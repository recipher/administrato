import { Link } from "@remix-run/react";

import Button, { ButtonProps } from './button';
import { useUser } from "~/hooks";

type Action = ButtonProps & { to?: string };
export type ActionsProps = Array<Action>;

type Props = {
  actions: ActionsProps,
};

export default function Actions({ actions = [] }: Props) {
  const { permissions } = useUser();

  const filter = (items: ActionsProps) => {
    return items.filter(({ permission }: Action) => {
      if (permission === undefined) return true;
      return permissions.includes(permission);
    });
  };

  return (
      filter(actions).map(action =>
        <span className="ml-3">
          {action.to === undefined
            ? <Button {...action} key={action.title} />
            : <Link to={action.to} key={action.title}><Button {...action} /></Link>}
        </span>
      )
  );
}
