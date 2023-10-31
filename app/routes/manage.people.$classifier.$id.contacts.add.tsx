import { type ActionArgs, type LoaderArgs, redirect, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { validationError, z } from '~/components/form';
import { useTranslation } from 'react-i18next';

import { badRequest, notFound } from '~/utility/errors';

import CountryService from '~/services/countries.server';
import PersonService, { Classifier } from '~/services/manage/people.server';
import ContactService, { create } from '~/services/manage/contacts.server';
import { ContactClassifier, Subs } from '~/services/manage';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';
  
import { getValidator, ContactForm } from '~/components/manage/contact-form';

export const handle = {
  i18n: 'contacts',
  name: 'add-contact',
  path: 'add',
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const { id, classifier } = params;
  if (id === undefined || classifier === undefined) return badRequest('Invalid data');

  const person = await PersonService(u).getPerson({ id });
  
  if (person === undefined) return notFound('Person not found');

  const classifiers = Object.values(ContactClassifier).filter(item => isNaN(Number(item)));
  const { countries } = await CountryService().listCountries({ limit: 300 });

  return json({ person, classifier, classifiers, subs: Subs, countries });
};

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

  const validator = getValidator(z);
    
  const { id, classifier } = params;
  if (id === undefined || classifier === undefined) return badRequest('Invalid data');

  const formData = await request.formData();

  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const { data: { 
    classifier: { id: contactClassifier }, 
    sub: subData, 
    ...data }} = result;
  
  // @ts-ignore
  const sub = subData.hasOwnProperty('id') ? subData.id : subData;

  const service = ContactService(u);
  await service.addContact(create({ entityId: id, entity: classifier, sub, classifier: contactClassifier, ...data }));
  
  return redirect('../');
};

const Add = () => {
  const data = useLoaderData();

  return <ContactForm {...data} heading="New Contact" subHeading="Please enter the new contact details."
    permission={manage.edit.person} />;
};

export default withAuthorization(manage.edit.person)(Add);