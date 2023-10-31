import { type ActionArgs, type LoaderArgs, redirect, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { validationError, z } from '~/components/form';
import { useTranslation } from 'react-i18next';

import { badRequest, notFound } from '~/utility/errors';

import CountryService from '~/services/countries.server';
import PersonService, { Classifier } from '~/services/manage/people.server';
import DependentsService, { create } from '~/services/manage/dependents.server';
import { ContactClassifier, Subs } from '~/services/manage';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
  
import { getValidator, DependentForm } from '~/components/manage/dependent-form';

export const handle = {
  i18n: 'contacts',
  name: 'add-dependent',
  path: 'add',
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const { id, classifier } = params;
  if (id === undefined || classifier === undefined) return badRequest('Invalid data');

  const person = await PersonService(u).getPerson({ id });
  
  if (person === undefined) return notFound('Person not found');

  const service = CountryService();
  const { countries } = await service.listCountries({ limit: 300 });

  return json({ person, classifier, countries });
};

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

  const validator = getValidator(z);
    
  const { id, classifier } = params;
  if (id === undefined || classifier === undefined) return badRequest('Invalid data');

  const formData = await request.formData();

  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const { data: { nationality: { id: nationality },
    honorific: { id: honorific }, 
    relationship: { id: relationship },
    ...data }} = result;
  
  const service = DependentsService(u);
  await service.addDependent({ relationship, personId: id, 
    dependent: create({ nationality, locality: nationality, honorific, ...data }) });
  
  return redirect('../');
};

const Add = () => {
  const data = useLoaderData<typeof loader>();

  return <DependentForm {...data} country={data.person.locality}
    heading="New Dependent" subHeading="Please enter the dependent information."
    permission={manage.edit.person} />;
};

export default withAuthorization(manage.edit.person)(Add);