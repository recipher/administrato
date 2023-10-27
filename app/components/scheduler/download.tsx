import { RefObject, useState } from 'react';
import { format } from 'date-fns';

import { ArrowDownIcon } from '@heroicons/react/24/outline';

import { type LegalEntity } from '~/services/manage/legal-entities.server';

import Modal, { type RefModal } from '~/components/modals/modal';
import { Lookup, DatePicker, Form, Select,
         withZod, zfd, z, useFormContext } from '../form';
import { useTranslation } from 'react-i18next';

type Props = { 
  modal: RefObject<RefModal>; 
  legalEntity: LegalEntity;
  year?: number;
  status: string;
  statuses: Array<string>;
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
  initialStatus: string;
  statuses: Array<string>;
  onCancel: Function;
  onDownload: Function;
};

const GenerateForm = ({ legalEntity, year = new Date().getFullYear(), initialStatus, statuses, onCancel, onDownload }: FormProps) => {
  const FORMAT = "yyyy-MM-dd";

  const { t } = useTranslation("schedule");
  const context = useFormContext("download-schedules");

  const startDate = new Date(year, 0, 1), endDate = new Date(year, 11, 31);

  const [ start, setStart ] = useState<string>(format(startDate, FORMAT));
  const [ end, setEnd ] = useState<string>(format(endDate, FORMAT));
  const [ status, setStatus ] = useState<string>(initialStatus);

  const handleDownload = (e: any) => {
    context.validate();
    if (!context.isValid)
      e.preventDefault();
    else onDownload();
  };

  const statusData = statuses.map(s => ({ id: s, name: t(s) }))

  return (
    <Form validator={validator} id="download-schedules">
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
          <ArrowDownIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Download Schedules
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Please select start and end dates to download.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-6">
            <div className="sm:col-span-full">
              <Lookup label='Legal Entity' name="legalEntityId" onClick={noOp} 
                      value={legalEntity} />
            </div>
            <div className="sm:col-span-full">
              <DatePicker label="Start Data" name="start" onChange={(d) => setStart(format(d, FORMAT))}
                value={startDate} />
            </div>
            <div className="sm:col-span-full">
              <DatePicker label="End Date" name="end"  onChange={(d) => setEnd(format(d, FORMAT))}
                value={endDate} />
            </div>
            <div className="sm:col-span-full">
              <Select label="Schedule Status" name="status" 
                defaultValue={statusData.find(s => s.id === initialStatus)}
                data={statusData} onChange={(status: any) => setStatus(status.id)}
               />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-[13rem] sm:flex sm:flex-row-reverse">
        <a href={`schedules/download?start=${start}&end=${end}&status=${status}`} 
           download={`${legalEntity.identifier}-${start}-${end}-${status}.xlsx`}
           className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
           onClick={(e) => handleDownload(e)}
        >
          Download
        </a>
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

export const DownloadModal = ({ modal, legalEntity, year, status, statuses }: Props) => {
  const handleCancel = () => modal.current?.hide();
  const handleDownload = () => modal.current?.hide();

  return (
    <Modal ref={modal}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[33rem]">
        <GenerateForm legalEntity={legalEntity} year={year} 
          initialStatus={status} statuses={statuses}
          onCancel={handleCancel} onDownload={handleDownload} />
      </div>
    </Modal>
  );
};