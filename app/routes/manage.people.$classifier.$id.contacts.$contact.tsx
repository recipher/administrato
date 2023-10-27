import { type ActionArgs, type LoaderArgs, redirect, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'

import { badRequest, notFound } from '~/utility/errors';

import CountryService from '~/services/countries.server';
import PersonService, { Classifier } from '~/services/manage/people.server';
import ContactService from '~/services/manage/contacts.server';
import { ContactClassifier, Subs } from '~/services/manage';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';

import { validationError, z } from '~/components/form';
import { getValidator, ContactForm } from '~/components/manage/contact-form';

export const handle = {
  i18n: 'contacts',
  name: 'add-contact',
  breadcrumb: ({ id, classifier, current, name }: { id: string, classifier: Classifier } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/people/${id}/${classifier}/add-contact`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);
  
  const { id, contact: contactId, classifier } = params;
  if (id === undefined || classifier === undefined || contactId === undefined) return badRequest('Invalid data');

  const person = await PersonService(u).getPerson({ id });
  
  if (person === undefined) return notFound('Person not found');

  const contact = await ContactService(u).getContact({ id: contactId });
  
  if (contact === undefined) return notFound('Contact not found');

  const classifiers = Object.values(ContactClassifier).filter(item => isNaN(Number(item)));
  const { countries } = await CountryService().listCountries({ limit: 300 });

  return json({ person, contact, classifier, classifiers, subs: Subs, countries });
};

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

  const validator = getValidator(z);

  const { id, contact: contactId, classifier } = params;
  if (id === undefined || classifier === undefined || contactId === undefined) return badRequest('Invalid data');

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
  await service.updateContact({ id: contactId, entityId: id, entity: classifier, sub, classifier: contactClassifier, ...data });
  
  return redirect('../contacts');
};

const Edit = () => {
  const data = useLoaderData();
  return <ContactForm {...data} heading="Edit Contact" subHeading="Please edit the contact details."
     permission={manage.edit.person} />;
};

export default withAuthorization(manage.edit.person)(Edit);