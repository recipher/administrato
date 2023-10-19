import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import { Stats } from '~/components';
import Header from '~/components/header';


export const handle = {
  name: "summary",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb to='/schedules/summary' name={name} current={current} />
};

const Summary = () => {
  const { t } = useTranslation();

  return (
    <>
      <Header title={t('summary')} />
      <Stats />
    </>
  );
};

export default Summary;
