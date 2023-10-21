import { forwardRef, Fragment, Ref, useEffect, useImperativeHandle, useRef, useState } from "react";
import { type LoaderArgs, json } from '@remix-run/node';
import { Dialog, Transition } from '@headlessui/react'
import { type IInboxMessagePreview, useInbox } from '@trycourier/react-hooks';
import { CourierClient } from '@trycourier/courier';
import { formatRelative } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { BellIcon, EnvelopeIcon, EnvelopeOpenIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';
import { List, ListItem, ListContext } from '~/components/list';

import Header from '~/components/header';
import { Alert, Level } from "~/components";
import classnames from "~/helpers/classnames";
import { useFetcher, useLoaderData } from "@remix-run/react";

export const handle = {
  name: "my-notifications",
  breadcrumb: ({ current, name }: BreadcrumbProps) => 
    <Breadcrumb Icon={BellIcon} to='/notifications/unread' name={name} current={current} />
};

export const loader = async ({ params }: LoaderArgs) => {
  const { filter } = params;

  return json({ filter });
};

export interface RefMessageModal {
  show: (messageId: string) => void;
};

interface Props {
  onRead?: (messageId: string | undefined) => void;
  onArchive?: (messageId: string | undefined) => void;
};

const MessageModal = forwardRef((props: Props, ref: Ref<RefMessageModal>) => {
  const fetcher = useFetcher();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messageId, setMessageId] = useState<string>();
  const [message, setMessage] = useState<any>();
  const archiveButtonRef = useRef(null);

  const archive = () => {
    setOpen(false);
    if (props.onArchive) props.onArchive(messageId);
  };

  const show = (id: string) => {
    if (fetcher.state === "idle") fetcher.load(`../notification/${id}`);

    setMessageId(id);
    setOpen(true);
    if (props.onRead) props.onRead(id);
  };
  const hide = () => setOpen(false);

  useImperativeHandle(ref, () => ({ show, hide }));

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.message)
      setMessage(fetcher.data.message);
  }, [fetcher]);

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
                      {message?.subject}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {message?.text}
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

const Read = () => <EnvelopeOpenIcon className="h-6 w-6 text-gray-400" />;
const Unread = () => <EnvelopeIcon className="h-6 w-6 text-indigo-600" />;

export default () => {
  const { filter } = useLoaderData();
  const [ loaded, setLoaded ] = useState(false);
  const [ unreadCount, setUnreadCount ] = useState<number | undefined>();
  const [ messages, setMessages ] = useState<Array<IInboxMessagePreview>>();

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

  useEffect(() => {
    const unread = inbox?.messages?.filter(m => m.read == null);
    setUnreadCount(unread?.length);
    if (filter === "unread") 
      setMessages(() => unread ? [ ...unread ] : undefined);
    else 
      setMessages(() => inbox?.messages ? [ ...inbox.messages ] : undefined);
  }, [inbox.messages, filter]);

  const Item = (message: IInboxMessagePreview) => 
    <ListItem image={message.read ? <Read/> : <Unread/>} data={
      <div className={classnames(message.read ? "font-normal text-gray-400" : "font-semibold text-indigo-500")}>
        {message.title}
      </div>} 
    />;
  const Context = (message: IInboxMessagePreview) => 
    <ListContext select={false} data={
      <div className={classnames(message.read ? "font-normal text-gray-400" : "font-medium text-gray-800")}>
        {formatRelative(new Date(message.created), new Date())}
      </div>} 
    />;

  const handleClick = (message: IInboxMessagePreview) => {
    modal.current?.show(message.messageId);
  };
  
  const handleRead = (messageId: string | undefined) => {
    if (messageId) inbox.markMessageRead(messageId);
  };
  
  const handleArchive = (messageId: string | undefined) => {
    if (messageId) inbox.markMessageArchived(messageId);
  };

  const tabs = [
    { name: "Unread notifications", to: '/notifications/unread', count: unreadCount },
    { name: "All notifications", to: '/notifications/all' },
  ];

  if ((inbox.isLoading && !loaded) || messages === undefined) return null;
  return (
    <>
      <Header title="My Notifications" tabs={tabs} />
      {messages?.length
        ? <List data={messages} renderContext={Context} renderItem={Item} onClick={handleClick} idKey="messageId" />
        : <Alert title="No notifications" level={Level.Info} />}

      <MessageModal ref={modal} onArchive={handleArchive} onRead={handleRead} />
    </>
  );
};
