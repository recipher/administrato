import { PropsWithChildren } from "react";

export default ({ text, children }: PropsWithChildren<{ text: string}>) => (
  <div className="group flex relative">
    {children}
    {text && <span className="group-hover:opacity-100 transition-opacity bg-gray-100 px-1 text-xs text-gray-700 rounded-md absolute left-1/2 
    -translate-x-1/2 translate-y-full opacity-0 m-4 mx-auto">
      {text}
    </span>}
  </div>
);