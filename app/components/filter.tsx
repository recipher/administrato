import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import pluralize from "~/helpers/pluralize";

export default ({ entity = '', onFilter }: { entity?: string, onFilter: Function }) => {
  const { t } = useTranslation();
  const [ text, setText ] = useState('');

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onFilter(text);
  };

  return (
    <form className="relative flex flex-1" onSubmit={handleSubmit}>
      <label htmlFor="q" className="sr-only">
        {t('search')} {entity && t(pluralize(entity))}
      </label>
      <MagnifyingGlassIcon
        className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
        aria-hidden="true"
      />
      <input
        id="q"
        className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-md"
        placeholder={`${t('search')} ${entity && t(pluralize(entity))}`}
        type="search"
        name="q"
        onChange={(e) => setText(e.target.value)}
      />
    </form>
  );
};