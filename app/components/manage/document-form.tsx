import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

import { type Document } from '~/services/manage/documents.server';

import { Combo, UniqueInput, Cancel, Submit, File,
  Body, Section, Group, Field, Footer,
  Form, withZod, zfd, z } from '~/components/form';

export const getSchema = (z: any) => {
  z.setErrorMap((issue: any, ctx: any) => {
    if (issue.code === z.ZodIssueCode.custom) {
      if (issue.path.includes("document"))
        return { message: "Please select a file" };
    }
    if (issue.code === z.ZodIssueCode.invalid_type) {
      if (issue.path.includes("folder"))
        return { message: "Folder is required" };
    }
    return { message: ctx.defaultError };
  });

  return zfd.formData({
    identifier: z
      .string()
      .min(0, { message: "Document name is required" }),
    folder: z
      .object({ id: z.string() }),
  });
};

type Props = {
  document?: Document | undefined;
  classifier: string;
  id: string;
  folders: Array<string>;
  permission: string;
  heading: string;
  subHeading: string;
};

export default ({ document, classifier, id, folders, permission,
                  heading, subHeading }: Props) => {
  
  const folderData = folders.map((folder: string) => ({ id: folder, name: folder }));
  const schema = getSchema(z);
  const validator = document ? withZod(schema) : withZod(schema.and(z.object({ document: zfd.file() })));

  return (
    <>
      <Form method="POST" validator={validator} id="document-form" encType="multipart/form-data" className="mt-6">
        <Body>
          <Section heading={heading} explanation={subHeading} />
          <Group>
            <Field>
              <UniqueInput label="Document Name" name="identifier" value={document?.identifier} disabled={document !== undefined}
                checkUrl={`/manage/people/${classifier}/${id}/documents/identifier`} property="document" message="A document with this name already exists" />
            </Field>
            <Field span={3}>
              <Combo label="Folder Name" name="folder" data={folderData} 
                defaultValue={folderData.find(f => f.id === document?.folder?.toLowerCase() )} />
            </Field>
          </Group>
          <Section size="md" heading='Select a File' explanation='Please click the choose button to select a file from your filesystem.' />
          <Group>
            <Field>
              <File label="Upload Document" name="document" accept="*/*" Icon={DocumentArrowUpIcon} />
            </Field>
          </Group>
        </Body>
        <Footer>
          <Cancel />
          <Submit text="Save" submitting="Saving..." permission={permission} />
        </Footer>
      </Form>
    </>
  );
};
