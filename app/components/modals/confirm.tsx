import { forwardRef, Fragment, Ref, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export interface RefConfirmModal {
  setValue: (value: any) => void;
  show: (_question: string, _yesTitle?: string, _noTitle?: string, _description?: string, _inputString?: string) => void;
};

interface Props {
  destructive?: boolean;
  inputType?: string;
  onYes?: (value: any) => void;
  onNo?: () => void;
};

const ConfirmModal = (props: Props, ref: Ref<RefConfirmModal>) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState<string>();
  const [value, setValue] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [yesTitle, setYesTitle] = useState<string>("");
  const [noTitle, setNoTitle] = useState<string>("");

  const yesButtonRef = useRef(null);
  const noButtonRef = useRef(null);

  useEffect(() => {
    setTitle("Are you sure?");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const no = () => {
    setOpen(false);
    if (props.onNo) props.onNo();
  };

  const yes = () => {
    setOpen(false);
    if (props.onYes) props.onYes(value);
  };

  const show = (
    _question: string,
    _yesTitle: string = "Yes",
    _noTitle: string = "Cancel",
    _description?: string
  ) => {
    setTitle(_question.toString());
    if (_yesTitle) setYesTitle(_yesTitle);
    if (_noTitle) setNoTitle(_noTitle);
    if (_description) setDescription(_description);
    setOpen(true);
  }

  useImperativeHandle(ref, () => ({ show, setValue }));

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="fixed z-50 inset-0 overflow-y-auto" initialFocus={yesButtonRef} onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:ml-10 sm:mt-4 sm:flex sm:pl-4">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto"
                    onClick={yes}
                    ref={yesButtonRef}
                  >
                    {yesTitle}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:ml-3 sm:mt-0 sm:w-auto"
                    onClick={no}
                    ref={noButtonRef}
                  >
                    {noTitle}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default forwardRef(ConfirmModal);

