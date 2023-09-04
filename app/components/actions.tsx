import { Link } from "@remix-run/react";

import Button, { ButtonProps } from './button';

export type ActionsProps = Array<ButtonProps & {
  to?: string;
}>;

type Props = {
  actions: ActionsProps,
};

export default function Actions({ actions = [] }: Props) {
  return (
      actions.map(action =>
        action.to === undefined
          ? <Button {...action} key={action.title} />
          : <Link to={action.to} key={action.title}><Button {...action} /></Link>
      )
  );
}
