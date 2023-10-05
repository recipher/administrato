import { PropsWithChildren } from "react";

export const Layout = ({ children }: PropsWithChildren<{}>) => (
  <div className="px-4 py-4 sm:px-6 lg:flex-auto lg:px-0 lg:py-4">
    <div className="mx-auto max-w-2xl space-y-8 sm:space-y-12 lg:mx-0 lg:max-w-none">
      <div>
        {children}
      </div>
    </div>
  </div>
);

export const Heading = ({ heading, explanation }: { heading: string, explanation?: string }) => (
  <>
    <h2 className="text-lg font-medium leading-7 text-gray-900">{heading}</h2>
    <p className="mt-1 text-sm leading-6 text-gray-500">
      {explanation}
    </p>
  </>
);

export const Section = ({ children }: PropsWithChildren<{}>) => (
  <dl className="mt-6 space-y-3 divide-y divide-gray-100 border-t border-gray-200 text-sm leading-6">
    {children}
  </dl>
);

export const Field = ({ title, children }: PropsWithChildren<{ title: string }>) => (
  <div className="pt-6 sm:flex group">
    <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">{title}</dt>
    <dd className="mt-1 flex justify-between gap-x-4 sm:mt-0 sm:flex-auto">
      {children}
    </dd>
  </div>
);
