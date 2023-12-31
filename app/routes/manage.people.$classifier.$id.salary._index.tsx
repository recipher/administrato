import { json, type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import PersonService from '~/services/manage/people.server';

import { requireUser } from '~/auth/auth.server';

import { notFound, badRequest } from '~/utility/errors';
import { Layout, Heading } from '~/components/info/info';

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id, classifier } = params;

  if (id === undefined || classifier === undefined) return badRequest('Invalid request');

  const u = await requireUser(request);

  const service = PersonService(u);
  const person = await service.getPerson({ id });
  
  if (person === undefined) return notFound('Person not found');
  
  return json({ person, classifier });
};

const Info = () => {
  const { t } = useTranslation();
  const { person } = useLoaderData();

  return (
    <>
      <Layout>
        <Heading heading={t('salary')} explanation={`Manage ${person.firstName}'s salary.`} />
      </Layout>
    </>
  );
};


export default Info;
