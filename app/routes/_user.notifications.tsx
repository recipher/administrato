import { forwardRef, Fragment, Ref, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Dialog, Transition } from '@headlessui/react'
import { type IInboxMessagePreview, useInbox } from '@trycourier/react-hooks';
import { formatRelative } from 'date-fns';
import { useTranslation } from "react-i18next";

import { BellIcon, EnvelopeIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';
import { List, ListItem, ListContext } from '~/components/list';

import { Alert, Level } from "~/components";
import classnames from "~/helpers/classnames";

export const handle = {
  name: "my-notifications",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb Icon={BellIcon} to='/notifications' name={name} current={current} />
};

export interface RefMessageModal {
  show: (message: IInboxMessagePreview) => void;
};

interface Props {
  onRead?: (message: IInboxMessagePreview | undefined) => void;
  onArchive?: (message: IInboxMessagePreview | undefined) => void;
};

const MessageModal = forwardRef((props: Props, ref: Ref<RefMessageModal>) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<IInboxMessagePreview>();
  const archiveButtonRef = useRef(null);

  const archive = () => {
    setOpen(false);
    if (props.onArchive) props.onArchive(message);
  };

  const show = (message: IInboxMessagePreview) => {
    setMessage(message);
    setOpen(true);
    if (props.onRead) props.onRead(message);
  };
  const hide = () => setOpen(false);

  useImperativeHandle(ref, () => ({ show, hide }));

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="fixed z-50 inset-0 overflow-y-auto" onClose={setOpen}>
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
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <EnvelopeIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-base font-medium leading-6 text-gray-900">
                      {message?.title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {message?.preview}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                    onClick={archive}
                    ref={archiveButtonRef}
                  >
                    {t('delete')}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});

export default () => {
  const [ loaded, setLoaded ] = useState(false);

  const inbox = useInbox();
  const modal = useRef<RefMessageModal>(null);

  useEffect(() => {
    inbox.fetchMessages();
    setLoaded(true);
    const interval = setInterval(() => {
      inbox.fetchMessages();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const Item = (message: IInboxMessagePreview) => 
    <ListItem data={
      <div className={classnames(message.read ? "font-normal text-gray-600" : "font-semibold text-gray-900")}>
        {message.title}
      </div>} 
    />;
  const Context = (message: IInboxMessagePreview) => 
    <ListContext select={false} data={
      <div className={classnames(message.read ? "font-normal text-gray-600" : "font-medium text-gray-900")}>
        {formatRelative(new Date(message.created), new Date())}
      </div>} 
    />;

  const handleClick = (message: IInboxMessagePreview) => {
    modal.current?.show(message);
  };
  
  const handleRead = (message: IInboxMessagePreview | undefined) => {
    if (message) inbox.markMessageRead(message.messageId);
  };
  
  const handleArchive = (message: IInboxMessagePreview | undefined) => {
    if (message) inbox.markMessageArchived(message.messageId);
  };

  if ((inbox.isLoading && !loaded) || inbox.messages === undefined) return null;
  return (
    <>
      {inbox.messages.length
        ? <List data={inbox.messages} renderContext={Context} renderItem={Item} onClick={handleClick} idKey="messageId" />
        : <Alert title="No notifications" level={Level.Info} />}

      <MessageModal ref={modal} onArchive={handleArchive} onRead={handleRead} />
    </>
  );
};
