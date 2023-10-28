import { useState } from 'react';
import { useTranslation } from 'react-i18next';


import { type Country } from '~/services/countries.server';
import { type Person } from '~/services/manage/people.server';
import { type Contact } from '~/services/manage/contacts.server';
import { ContactClassifier, Subs } from '~/services/manage';

import { manage } from '~/auth/permissions';

import { Form, withZod, zfd, z,
  Input, Phone, Select, Cancel, Submit,
  Body, Section, Group, Field, Footer } from '~/components/form';
import { flag } from '~/components/countries/flag';
  
export const getValidator = (z: any) => {
  z.setErrorMap((issue: any, ctx: any) => {
    if (issue.code === "invalid_type") {
      if (issue.path.includes("classifier"))
        return { message: "Contact method is required" };
      if (issue.path.includes("sub"))
        return { message: "Additional data is required" };
    }
    return { message: ctx.defaultError };
  });

  return withZod(
    zfd.formData({
      value: z
        .string()
        .nonempty("Value is required"),
      classifier: z
        .object({ id: z.string() })
        .required(),
      sub: z
        .object({ id: z.string() }).required().or(z.string().nonempty('Additional data is required'))
    })
  );
};

type Props = {
  person: Person;
  contact?: Contact;
  classifiers: Array<string>;
  subs: typeof Subs;
  countries: Array<Country>;
  heading: string;
  subHeading: string;
  permission: string;
};

export const ContactForm = ({ person, contact, classifiers, subs, countries, heading, subHeading, permission }: Props) => {
  const { t } = useTranslation("contacts");
  const validator = getValidator(z);

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
    [ContactClassifier.Phone]: <Phone label={t(`${classifier}-value`)} name="value" countries={countryData} isoCode={person.locality} value={contact?.value} />,
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
      <Form method="POST" validator={validator} id="save-contact" className="mt-6">
        <Body>
          <Section heading={heading} explanation={subHeading} />
          <Group>
            <Field span={2}>
              <Select label="Contact Method" name="classifier" 
                defaultValue={classifierData.find((c: any) => c.id === contact?.classifier)}
                data={classifierData} onChange={handleChangeClassifier} />
            </Field>
          </Group>
          <Section />
          <Group>
            <Field span={2} className={classifier === undefined ? "hidden" : ""}>
              {subData.length > 0 && <Select label={t(`${classifier}-sub`)} name="sub" data={subData} defaultValue={subData.find((d: any) => d.id === contact?.sub)} />}
              {subData.length === 0 && <Input label={t(`${classifier}-sub`)} name="sub" value={contact?.sub} />}
            </Field>
            <Field span={3} className={classifier === undefined ? "hidden" : ""}>
              {input || <Input label={t(`${classifier}-value`)} name="value" type={type} pre={pre} value={contact?.value} />}
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
