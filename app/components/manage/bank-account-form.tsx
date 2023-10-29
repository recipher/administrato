import { useState, useEffect } from 'react';
import { Form, withZod, zfd, z } from '~/components/form';
import { useTranslation } from 'react-i18next';
import { type BankAccount } from '~/services/manage/banking.server';
import { type Country } from '~/services/countries.server';
import { BankAccountClassifiers } from '~/services/manage';
import { getBankingConfig, type BankingConfig } from '~/services/manage/banking';
import { flag } from '~/components/countries/flag';

import { Input, Select, Cancel, Submit,
  Body, Section, Group, Field, Footer } from '~/components/form';
import { type EventFor } from '~/helpers';

export const getValidator = (z: any) => {
  z.setErrorMap((issue: any, ctx: any) => {
    if (issue.code === "invalid_type") {
      if (issue.path.includes("country"))
        return { message: "Country is required" };
    }
    return { message: ctx.defaultError };
  });

  return withZod(
    zfd.formData({
      classifier: z.object({ id: z.string() }),
      country: z.object({ id: z.string(), name: z.string() }),
      number: z.string().min(1),
    })
  );
};

type Props = {
  bankAccount?: BankAccount;
  isoCode: string; 
  countries: Array<Country>;
  permission: string;
  heading: string;
  subHeading: string;
};

export const BankAccountForm = ({ bankAccount, isoCode, countries, permission, heading, subHeading }: Props) => {
  const { t } = useTranslation("banking");

  const [ classifier, setClassifier ] = useState(BankAccountClassifiers.at(0) as string);
  
  const countryData = countries.map((country: Country) => ({
    id: country.isoCode, name: country.name, 
    image: flag(country.isoCode)
  }));

  const [ country, setCountry ] = useState(countryData.find((c: any) => c.id === bankAccount?.countryIsoCode || c.id === isoCode ));
  const [ config, setConfig ] = useState<BankingConfig | undefined>();
  const [ bank, setBank ] = useState<string>('');
  const [ branch, setBranch ] = useState<string>('');
  const [ account, setAccount ] = useState<string>('');
  const [ number, setNumber ] = useState<string>(bankAccount?.number || '');
  const [ ibanPrefix, setIbanPrefix ] = useState<string>('');

  const classifierData = BankAccountClassifiers.map((id: string) => ({ id, name: t(id) }));

  const handleChangeCountry = (country: any) => {
    setCountry(country);
  };

  useEffect(() => {
    if (country) setConfig(getBankingConfig(country.id));
  }, [ country ]);

  useEffect(() => {
    const ibanConfig = config?.iban;
    setIbanPrefix(`${country?.id}${ibanConfig?.checkDigits}`);
  }, [ config ]);

  useEffect(() => {
    setNumber(`${bank}${branch}${account}`);
  }, [ bank, branch, account ]);

  const handleChangeBank = (e: EventFor<"input", "onChange">) => {
    const value = e.currentTarget.value;
    setBank(value);
  };

  const handleChangeBranch = (e: EventFor<"input", "onChange">) => {
    const value = e.currentTarget.value;
    setBranch(value);
  };

  const handleChangeAccount = (e: EventFor<"input", "onChange">) => {
    const value = e.currentTarget.value;
    setAccount(value);
  };

  return (
    <>
      <Form method="POST" validator={getValidator(z)} id="save-bank-account" encType="multipart/form-data" className="mt-6">
        <Body>
          <Section heading={heading} explanation={subHeading} />
          <Group>
            <Field span={3}>
              <Select onChange={({ id }: any) => setClassifier(id)}
                label='Select Account Type'
                name="classifier" 
                data={classifierData} 
                defaultValue={classifierData.at(0)} />
            </Field>
            <Field span={3}>
              <Select onChange={handleChangeCountry}
                label='Select Country'
                name="country" 
                data={countryData} defaultValue={country} />
            </Field>
          </Group>
          <Section size="md" />
          <Group>
            {config?.bban.bankIdentifier && <Field span={2}>
              <Input name="bank" label="Bank" onChange={handleChangeBank} />
            </Field>}
            {config?.bban.branchIdentifier && <Field span={2}>
              <Input name="branch" label="Branch" onChange={handleChangeBranch} />
            </Field>}
            <Field span={2}>
              <Input name="account" label="Account Number" onChange={handleChangeAccount} />
            </Field>
            <Field>
              <Input name="number" label="IBAN" pre={ibanPrefix} value={number} />
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
