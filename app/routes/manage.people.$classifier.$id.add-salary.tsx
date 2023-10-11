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

import { requireUser } from '~/auth/auth.server';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import withAuthorization from '~/auth/with-authorization';
import { manage } from '~/auth/permissions';

import { Input, Select, Cancel, Submit, Image,
  Body, Section, Group, Field, Footer, Lookup } from '~/components/form';

export const handle = {
  name: 'add-contact',
  breadcrumb: ({ id, classifier, current, name }: { id: string, classifier: Classifier } & BreadcrumbProps) => 
    <Breadcrumb to={`/manage/people/${id}/${classifier}/add-contact`} name={name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id, classifier } = params;
  if (id === undefined || classifier === undefined) return badRequest('Invalid data');

  return json({ id, classifier });
};

const validator = withZod(
  zfd.formData({
    amount: z
      .string()
      .nonempty("Amount is required"),
  })
);

export const action = async ({ request, params }: ActionArgs) => {
  const u = await requireUser(request);

  const { id, classifier } = params;
  if (id === undefined || classifier === undefined) return badRequest('Invalid data');

  const formData = await request.formData();

  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const { data } = result;
  
  const service = ContactService(u);
  const contact = await service.addContact(create({ entityId: id, entity: classifier, ...data }));
  
  return redirect('../contacts');
};

const Add = () => {
  const { t } = useTranslation();
  const { } = useLoaderData();

  return (
    <>
      <Form method="POST" validator={validator} id="add-salary" className="mt-5">
        <Body>
          <Section heading='New Salary' explanation='Please enter the new salary data.' />
          <Group>
            <Field span={3}>
              <Input label="Amount" name="amount" />
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