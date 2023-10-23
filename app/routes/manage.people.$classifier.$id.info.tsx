import { json, type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import PersonService, { type Person, Classifier } from '~/services/manage/people.server';
import CountryService, { type Country } from '~/services/countries.server';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";

import { notFound, badRequest } from '~/utility/errors';
import { Layout, Heading, Section, Field } from '~/components/info/info';

import { configs } from './manage.people';

export const handle = {
  name: "info",
  breadcrumb: ({ person, classifier, current, name }: { person: Person, classifier: Classifier } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/people/${classifier}/${person?.id}/info`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id, classifier } = params;

  if (id === undefined || classifier === undefined) return badRequest('Invalid request');

  const config = configs.get(classifier);

  const u = await requireUser(request);

  const service = PersonService(u);
  const person = await service.getPerson({ id });
  
  if (person === undefined) return notFound('Person not found');
  
  const countryService = CountryService();
  const countries = await countryService.getCountries({ isoCodes: [ person.locality, person.nationality ] });
  
  return json({ person, classifier, config, countries });
};

const Info = () => {
  const { t } = useTranslation();
  const { person, config, countries } = useLoaderData();

  return (
    <>
      <Layout>
        <Heading heading={t('info')} explanation={`Manage ${person.firstName}'s information.`} />
        <Section>
          <Field title="Worker Name">
            <p className="text-gray-900">{person.name}</p>
            <button type="button" className="hidden group-hover:hidden font-medium text-indigo-600 hover:text-indigo-500">
              Update
            </button>
          </Field>
          <Field title="Nationality">
            <p className="text-gray-900">{countries.find((c: Country) => c.isoCode === person.nationality).name}</p>
            <button type="button" className="hidden group-hover:hidden font-medium text-indigo-600 hover:text-indigo-500">
              Update
            </button>
          </Field>
          <Field title="Location">
            <p className="text-gray-900">{countries.find((c: Country) => c.isoCode === person.locality).name}</p>
            <button type="button" className="hidden group-hover:hidden font-medium text-indigo-600 hover:text-indigo-500">
              Update
            </button>
          </Field>
          {config.client && <Field title="Client">
            <Link className="text-indigo-900" to={`/manage/clients/${person.clientId}/info`}>{person.client}</Link>
          </Field>}
          {config.legalEntity && <Field title="Legal Entity">
            <Link className="text-indigo-900" to={`/manage/legal-entities/${person.legalEntityId}/info`}>{person.legalEntity}</Link>
          </Field>}
        </Section>
      </Layout>
    </>
  );
};


export default Info;
