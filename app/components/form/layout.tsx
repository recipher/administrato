import { PropsWithChildren } from "react";

export const Body = ({ children }: PropsWithChildren<{}>) => {
  return (

    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
        {children}
      </div>
    </div>
  );
};

export const Section = ({ heading, explanation, size = "lg" }: { heading: string, explanation?: string, size?: string }) => {
  return (
    <div>
      <h2 className={`text-${size} font-semibold leading-7 text-gray-900`}>
        {heading}
      </h2>
      <p className="mt-1 text-sm leading-6 text-gray-600">
        {explanation}
      </p>
    </div>
  );
};

export const Group = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-6 md:col-span-2">
      {children}
    </div>
  );
};

export const Field = ({ span = 4, children }: PropsWithChildren<{ span?: number }>) => {
  return (
    <div className={`sm:col-span-${span}`}>
      {children}
    </div>
  );
};

export const Footer = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div className="mt-6 flex items-center justify-end gap-x-6">
      {children}
    </div>
  );
};