import { RefObject } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { type LegalEntity } from '~/models/manage/legal-entities.server';

import Modal, { type RefModal } from '~/components/modals/modal';
import { Lookup, DatePicker, Form, withZod, zfd, z, validationError, useFormContext } from '../form';

type Props = { 
  modal: RefObject<RefModal>; 
  legalEntity: LegalEntity;
  year?: number;
  onGenerate: Function;
};

export const validator = withZod(
  zfd.formData({
    start: z
      .string()
      .nonempty('Start date is required')
      .transform(date => new Date(date)),
    end: z
      .string()
      .nonempty('End date is required')
      .transform(date => new Date(date)),
    legalEntityId: z
      .string()
  })
);

const noOp = () => null!

type FormProps = { 
  legalEntity: LegalEntity;
  year?: number | undefined;
  onCancel: Function;
  onGenerate: Function;
};

const GenerateForm = ({ legalEntity, year = new Date().getFullYear(), onCancel, onGenerate }: FormProps) => {
  const context = useFormContext("generate");
  const handleGenerate = () => {
    context.validate();
    if (context.isValid) onGenerate(context.getValues());
  };

  return (
    <Form validator={validator} id="generate">
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
          <QuestionMarkCircleIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Generate Schedules?
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Are you sure you want to generate schedules for this legal entity?
            </p>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-6">
            <div className="sm:col-span-full">
              <Lookup label='Legal Entity' name="legalEntityId" onClick={noOp} 
                      value={legalEntity} />
            </div>
            <div className="sm:col-span-full">
              <DatePicker label="Start" name="start" value={new Date(year, 0, 1)} />
            </div>
            <div className="sm:col-span-full">
              <DatePicker label="End" name="end" value={new Date(year, 11, 31)} />
            </div>
          </div>
          <div className="mt-10">
            <p className="text-sm text-gray-500 italic">
              Please select start and end dates. 
              Take note, this will generate a draft, and will not 
              overwrite any existing schedules. 
            </p>
          </div>
        </div>
      </div>
      <div className="mt-[13rem] sm:flex sm:flex-row-reverse">
        <button
          type="button"
          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
          onClick={() => handleGenerate()}
        >
          Generate Now
        </button>
        <button
          type="submit"
          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
          onClick={() => onCancel()}
        >
          Cancel
        </button>
      </div>
    </Form>
  );
};

export const GenerateSingleModal = ({ modal, legalEntity, year, onGenerate }: Props) => {
  const handleCancel = () => {
    modal.current?.hide();
  };

  const handleGenerate = (data: FormData) => {
    onGenerate(data);
    modal.current?.hide();
  };

  return (
    <Modal ref={modal}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[33rem]">
        <GenerateForm legalEntity={legalEntity} year={year}
          onCancel={handleCancel} onGenerate={handleGenerate} />
      </div>
    </Modal>
  );
};