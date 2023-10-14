import { useRef, useState } from 'react';
import { type ActionArgs, type LoaderArgs, redirect, json, type UploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { Form, validationError, withZod, zfd, z } from '~/components/form';
import { useTranslation } from 'react-i18next';

import { badRequest } from '~/utility/errors';

import { Classifier } from '~/services/manage/people.server';
import ContactService, { create } from '~/services/manage/contacts.server';
import { ContactClassifier, Subs } from '~/services/manage';

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';

import { Input, Select, Cancel, Submit,
  Body, Section, Group, Field, Footer } from '~/components/form';

export const handle = {
  i18n: 'contacts',
  name: 'add-contact',
  breadcrumb: ({ id, classifier, current, name }: { id: string, classifier: Classifier } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/people/${id}/${classifier}/add-contact`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id, classifier } = params;
  if (id === undefined || classifier === undefined) return badRequest('Invalid data');

  const classifiers = Object.values(ContactClassifier).filter(item => isNaN(Number(item)));

  return json({ id, classifier, classifiers, subs: Subs });
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
  
  return redirect('../contacts');
};

const Add = () => {
  const { t } = useTranslation("contacts");
  const { classifiers, subs } = useLoaderData();

  const [ classifier, setClassifier ] = useState<string>();
  const [ subData, setSubData ] = useState<Array<{ id: string, name: string }>>([]);

  const toSelectable = (id: string) => ({ id, name: t(id, { ns: "contacts" }) });
  const classifierData = classifiers?.map(toSelectable);
  const handleChangeClassifier = (classifier: { id: string }) => {
    const c = classifier.id as ContactClassifier;
    setSubData(subs[c].map(toSelectable));
    setClassifier(c);
  };

  const type = {
    [ContactClassifier.Email]: "email",
    [ContactClassifier.Phone]: "tel",
    [ContactClassifier.Social]: "text",
    [ContactClassifier.Web]: "text",
  }[classifier || ContactClassifier.Web];

  return (
    <>
      <Form method="POST" validator={validator} id="add-contact" className="mt-6">
        <Body>
          <Section heading='New Contact' explanation='Please enter the new contact details.' />
          <Group>
            <Field span={2}>
              <Select label="Contact Method" name="classifier" 
                data={classifierData} onChange={handleChangeClassifier} />
            </Field>
          </Group>
          <Section />
          <Group>
            <Field span={2} className={classifier === undefined ? "hidden" : ""}>
              {subData.length > 0 && <Select label={t(`${classifier}-sub`)} name="sub" data={subData} />}
              {subData.length === 0 && <Input label={t(`${classifier}-sub`)} name="sub" />}
            </Field>
            <Field span={4} className={classifier === undefined ? "hidden" : ""}>
              <Input label={t(`${classifier}-value`)} name="value" type={type} />
            </Field>
          </Group>
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={manage.create.worker} />
        </Footer>
      </Form>
    </>
  );
}

export default withAuthorization(manage.edit.worker)(Add);