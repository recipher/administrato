import { PropsWithChildren, ReactNode } from "react";

import classnames from "~/helpers/classnames";

export const Body = ({ border = true, children }: PropsWithChildren<{ border?: boolean }>) => {
  return (
    <div className="space-y-3">
      <div className={classnames(border ? "border-b border-gray-900/10" : "", `grid grid-cols-1 gap-x-8 gap-y-3 pb-12 md:grid-cols-3`)}>
        {children}
      </div>
    </div>
  );
};

export const Section = ({ heading, explanation, size = "lg" }: { heading?: string, explanation?: string | ReactNode, size?: string }) => {
  return (
    <div>
      <h2 className={classnames(size !== "lg" ? "font-medium" : "font-semibold", `text-${size} leading-7 text-gray-900`)}>
        {heading}
      </h2>
      <p className={classnames(heading === undefined ? "" : "mt-1", "text-sm leading-6 text-gray-600")}>
        {explanation}
      </p>
    </div>
  );
};

export const Group = ({ cols = 6, children }: PropsWithChildren<{ cols?: number }>) => {
  return (
    <div className={`grid max-w-4xl grid-cols-1 gap-x-6 sm:grid-cols-${cols} md:col-span-2`}>
      {children}
    </div>
  );
};

export const Field = ({ span = 4, width, className = "", children }: PropsWithChildren<{ span?: number | string, className?: string, width?: string }>) => {
  return (
    <div className={classnames(className, width ? `w-${width}` : "", `sm:col-span-${span}`)}>
      {children}
    </div>
  );
};

export const Footer = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div className="mt-4 flex items-center justify-end gap-x-6">
      {children}
    </div>
  );
};