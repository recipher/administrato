import { useRef, useState, useEffect } from "react";
import { useSubmit, useActionData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { FormContextValue, ValidationResult, ValidatorError, validationError } from "remix-validated-form";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import CountryService, { type Country } from '~/models/countries.server';

import { RefModal } from "../modals/modal";

import { CountriesModal } from "./countries";
import { Section, Group, Field } from "../form/layout";
import { Select } from '../form';
import Button, { ButtonType } from '../button';

export const changeCodes = async (data: string) => {
  const service = CountryService();

  if (data === "") return { codes: [], regions: [], countries: [] };

  const codes = data.split(',')
    .reduce((codes: string[], code: string) => 
      codes.includes(code) ? codes : [ ...codes, code ], []);
  
  const isoCodes = await service.getIsoCodes({ isoCodes: codes });
  const countries = await service.getCountries({ isoCodes });
  const regions = await service.getRegions({ isoCodes });

  return { codes, regions, countries };
};

export const buildValidationError = async (error: ValidatorError, localities: any) => {
  const service = CountryService();

  const codes = [ localities.isoCode ].flat();
  const countries = await service.getCountries({ isoCodes: codes });
  const regions = await service.getRegions({ isoCodes: codes });
  return { ...validationError(error), codes, countries, regions };
};

type Props = { 
  context: FormContextValue;
  data: {
    codes: Array<string>;
    regions: Array<Country>;
    countries: Array<Country>;
  } | undefined;
};

export function CountryFormManager({ context, data }: Props) {
  const { t } = useTranslation();
  const submit = useSubmit();
  const modal = useRef<RefModal>(null);

  const [ country, setCountry ] = useState<Country>();

  const findRegions = (code: string | null) => 
    data?.regions?.filter((r: Country) => r.parent === code)
      .map((r: Country) => ({ id: r.isoCode, ...r }));

  const findCountry = (code: string | null) => {
    const c = data?.countries?.find((c: Country) => c.isoCode === code);
    return c && { id: c.isoCode, ...c };
  };

  const findRegion = (code: string | null) => {
    const r = data?.regions?.find((c: Country) => c.isoCode === code);
    return r && { id: r.isoCode, ...r };
  };
        
  const showCountriesModal = () => {
    setCountry(undefined);
    modal.current?.show();
  };
  const showRegions = (country: Country) => {
    if (country === undefined) 
      showCountriesModal();
    else
      setCountry(country);
  };

  useEffect(() => {
    if (country) modal.current?.show();
  }, [country]);

  const selectCountry = (country: Country) => {
    const codes = data?.codes || [];
    submit({ intent: "change-codes", codes: [ ...codes, country.isoCode ] }, 
           { method: "post", encType: "multipart/form-data" });  
  };

  const removeCountry = (country: Country | undefined) => {
    if (country === undefined) return;
    const codes = (data?.codes || []).filter((code: string) => code !== country.isoCode);
    submit({ intent: "change-codes", codes }, { method: "post", encType: "multipart/form-data" });  
  };

  useEffect(() => {
    context.validate();  // HACK :)
  }, [data]);

  return (
    <>
      <Section size="md" heading='Specify Countries or Regions' explanation='Enter the countries to which the centre is associated, or select a specific region.' />
      <Group>
        <Field>
          <Button title="Select a Country" 
            icon={MagnifyingGlassIcon} 
            type={ButtonType.Secondary} 
            onClick={showCountriesModal} />

            {context.fieldErrors.localities && 
              <p className="mt-2 text-sm text-red-600">
                Please specify at least one country
              </p>}
        </Field>

        {data?.codes?.map((code: string) => {
          const region = findRegion(code);
          const isoCode = region ? region.parent : code;
          const country = findCountry(isoCode);
          const regions = findRegions(isoCode);
          const countryAndRegions = country && regions ? [ country ].concat(regions) : [];

          return (
            <>
              <Field span={3} key={code}>
                <Select 
                  label='Select Country or a Region'
                  name="localities" 
                  defaultValue={region || country}
                  data={countryAndRegions} />
              </Field>
              <Field span={1}>
                <button onClick={() => removeCountry(region || country)}
                  type="button" className="text-sm mt-10 text-red-600 hover:text-red-500">
                  {t('remove')}
                </button>
              </Field>
            </>
          )})}
      </Group>
      <CountriesModal modal={modal} country={country}
        onSelect={selectCountry} onSelectRegion={showRegions} />
    </>
  );
};