import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Honorifics } from '~/services/manage';
import { Input, Select, Section, Group, Field } from '~/components/form';

const toKebab = (str: string) => 
  str.replace(/([a-z0-9])([A-Z0-9])/g, '$1-$2').toLowerCase();

export const NameForm = ({ nameConfig }: { nameConfig: Array<Array<string>> | undefined }) => {
  const { t } = useTranslation("address");

  if (nameConfig === undefined) return null;

  const names = new Map<string, ReactNode>([
    [ "honorific", <Select label={t('honorific')} name="honorific" 
                      data={Honorifics.map(id => ({ id, name: id }))} /> ],
  ]);
  const spans = new Map<string, number>([
    [ "honorific", 2 ],
  ]);
  
  return nameConfig?.map((properties: Array<string>) => (
    <>
      <Section />
      <Group cols={11}>
        {properties.map((property: string) => {
          const input = names.get(property),
                span = spans.get(property);
          return (
            <Field span={span || 3}>
              {input || <Input label={t(toKebab(property))} name={property} />}
            </Field>
          )})}
      </Group>
    </>
  ));
};