import { PropsWithChildren } from "react";
import classnames from "~/helpers/classnames";

export enum Level {
  Info,
  Success,
  Warning,
  Error,
};

type Props = { 
  text?: string | undefined;
  level?: Level;
};

const colours = new Map<Level, string>([
  [ Level.Info, 'blue' ],
  [ Level.Error, 'red' ],
  [ Level.Success, 'green' ],
  [ Level.Warning, 'yellow' ],  
]);

export default ({ text, level = Level.Error, children }: PropsWithChildren<Props>) => {
  const colour = colours.get(level);

  return (
    <span className="group relative w-max cursor-pointer z-0">
      {children}
      <span className={classnames(text === undefined ? "" : "group-hover:opacity-100",
       `bg-${colour}-50 border-${colour}-400 text-${colour}-700`,
       `pointer-events-none z-10
        absolute -top-8 -left-1/2 w-max 
        px-2 py-1 text-sm font-normal shadow rounded
        opacity-0 transition-opacity`)}>
        {text}
      </span>
    </span>
  );
};