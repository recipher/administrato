import { useSearchParams } from "@remix-run/react";

export default (to?: string | undefined, searchParams: URLSearchParams) => {
  if (to === undefined) return ".";
  const [ path, qs = "" ] = to.split("?");      
  const urlSearchParams = new URLSearchParams(qs);
  searchParams.forEach((value: string, key: string) => {
    urlSearchParams.set(key, value);
  });
  return `${path}?${urlSearchParams.toString()}`;
};