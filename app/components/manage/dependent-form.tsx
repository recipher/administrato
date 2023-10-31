import { useState } from 'react';
import NameConfigurator from '@recipher/i18n-postal-address';

import { type Country } from '~/services/countries.server';
import { NameFields, Relationships } from '~/services/manage';

import { NameForm } from './name-form';
import { Form, withZod, zfd, z,
  Input, Phone, Select, SelectItem, Cancel, Submit,
  Body, Section, Group, Field, Footer } from '~/components/form';
import { flag } from '~/components/countries/flag';
  
export const getValidator = (z: any) => {
  z.setErrorMap((issue: any, ctx: any) => {
    if (issue.code === "invalid_type") {
    }
    return { message: ctx.defaultError };
  });

  return withZod(
    zfd.formData({
      firstName: z
        .string()
        .nonempty("First name is required"),
      secondName: z.string().optional(),
      firstLastName: z.string().optional(),
      secondLastName: z.string().optional(),
      lastName: z.string().optional(),
      honorific: z
        .object({ id: z.string()})
        .optional(),
      nationality: z.object({ id: z.string()}),
      relationship: z.object({ id: z.string()}),
    })
  );
};

type Props = {
  country: string;
  countries: Array<Country>;
  heading: string;
  subHeading: string;
  permission: string;
};

export const DependentForm = ({ country, countries, heading, subHeading, permission }: Props) => {
  const validator = getValidator(z);

  const [ nameConfig, setNameConfig ] = useState<Array<Array<string>>>();

  const countryData = countries.map((country: Country) => ({
    id: country.isoCode, name: country.name, 
    image: flag(country.isoCode)
  }));

  const handleChangeNationality = (nationality: any) => {
    const name = new NameConfigurator();
    NameFields.forEach((key: string) => name.setProperty(key, key));
    name.setFormat({ country: nationality.id });
    setNameConfig(name.toArray());
  };

  return (
    <>
      <Form method="POST" validator={validator} id="save-dependent" className="mt-6">
        <Body>
          <Section heading={heading} explanation={subHeading} />
          <Group>
            <Field span={3}>
              <Select onChange={handleChangeNationality}
                label='Select Nationality'
                name="nationality" 
                defaultValue={countryData.find(c => c.id === country)}
                data={countryData} />
            </Field>
          </Group>
          <NameForm nameConfig={nameConfig} />
          <Section size="md" />
          <Group>
            <Field span={2}>
              <Select 
                label='Specify Relationship'
                name="relationship" 
                data={Relationships.map(id => ({ id, name: id }))} />
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
