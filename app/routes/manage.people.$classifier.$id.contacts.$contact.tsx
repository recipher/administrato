import { useState } from 'react';
import { type ActionArgs, type LoaderArgs, redirect, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { Form, validationError, withZod, zfd, z } from '~/components/form';
import { useTranslation } from 'react-i18next';

import { badRequest, notFound } from '~/utility/errors';

import CountryService, { type Country } from '~/services/countries.server';
import PersonService, { Classifier } from '~/services/manage/people.server';
import ContactService, { create } from '~/services/manage/contacts.server';
import { ContactClassifier, Subs } from '~/services/manage';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';

import { Input, Phone, Select, Cancel, Submit,
  Body, Section, Group, Field, Footer } from '~/components/form';
import { flag } from '~/components/countries/flag';
  
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

z.setErrorMap((issue, ctx) => {
  if (issue.code === "invalid_type") {
    if (issue.path.includes("classifier"))
      return { message: "Contact method is required" };
    if (issue.path.includes("sub"))
      return { message: "Additional data is required" };
  }
  return { message: ctx.defaultError };
});

const validator = withZod(
  zfd.formData({
    value: z
      .string()
      .nonempty("Value is required"),
    classifier: z
      .object({ id: z.string() })
      .required(),
    sub: z
      .object({ id: z.string() }).required().or(z.string().nonempty('Required'))
  })
);

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

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

const Add = () => {
  const { t } = useTranslation("contacts");
  const { person, contact, classifiers, subs, countries } = useLoaderData();

  const [ classifier, setClassifier ] = useState<string>();
  const [ subData, setSubData ] = useState<Array<{ id: string, name: string }>>([]);

  const countryData = countries.map(({ isoCode: id, name, diallingCode }: Country) => ({ id, diallingCode, name, image: flag(id)  }));

  const toSelectable = (id: string) => ({ id, name: t(id, { ns: "contacts" }) });
  const classifierData = classifiers?.map(toSelectable);
  const handleChangeClassifier = (classifier: { id: string }) => {
    const c = classifier.id as ContactClassifier;
    setSubData(subs[c].map(toSelectable));
    setClassifier(c);
  };

  const input = {
    [ContactClassifier.Phone]: <Phone label={t(`${classifier}-value`)} name="value" countries={countryData} isoCode={person.locality} value={contact.value} />,
  }[classifier || ContactClassifier.Web];

  const pre = {
    [ContactClassifier.Web]: "http://",
  }[classifier || ContactClassifier.Web];

  const type = {
    [ContactClassifier.Email]: "email",
    [ContactClassifier.Social]: "text",
    [ContactClassifier.Web]: "text",
  }[classifier || ContactClassifier.Web];

  return (
    <>
      <Form method="POST" validator={validator} id="add-contact" className="mt-6">
        <Body>
          <Section heading='Edit Contact' explanation='Please edit the contact details.' />
          <Group>
            <Field span={2}>
              <Select label="Contact Method" name="classifier" 
                defaultValue={classifierData.find((c: any) => c.id === contact.classifier)}
                data={classifierData} onChange={handleChangeClassifier} />
            </Field>
          </Group>
          <Section />
          <Group>
            <Field span={2} className={classifier === undefined ? "hidden" : ""}>
              {subData.length > 0 && <Select label={t(`${classifier}-sub`)} name="sub" data={subData} defaultValue={subData.find((d: any) => d.id === contact.sub)} />}
              {subData.length === 0 && <Input label={t(`${classifier}-sub`)} name="sub" value={contact.sub} />}
            </Field>
            <Field span={3} className={classifier === undefined ? "hidden" : ""}>
              {input || <Input label={t(`${classifier}-value`)} name="value" type={type} pre={pre} value={contact.value} />}
            </Field>
          </Group>
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={manage.edit.person} />
        </Footer>
      </Form>
    </>
  );
}

export default withAuthorization(manage.edit.person)(Add);