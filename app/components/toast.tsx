import { Fragment, useEffect, useState } from 'react'
import { Transition } from '@headlessui/react'
import { 
  XMarkIcon,
  ExclamationTriangleIcon, 
  XCircleIcon, 
  CheckCircleIcon,
  InformationCircleIcon } from '@heroicons/react/20/solid'

import classnames from '~/helpers/classnames';

export enum Level {
  Info,
  Success,
  Warning,
  Error,
};

type Props = {
  level?: Level;
  title?: string;
  message?: string;
  hideAfter?: number;
};

const colours = new Map<Level, string>([
  [ Level.Info, 'blue' ],
  [ Level.Error, 'red' ],
  [ Level.Success, 'green' ],
  [ Level.Warning, 'yellow' ],  
]);

const icons = new Map<Level, any>([
  [ Level.Info, InformationCircleIcon ],
  [ Level.Error, XCircleIcon ],
  [ Level.Success, CheckCircleIcon ],
  [ Level.Warning, ExclamationTriangleIcon ],  
]);

export default function Toast({ level = Level.Success, title, message, hideAfter = 10 }: Props) {
  if (message === undefined) return;

  const [show, setShow] = useState(true);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setShow(false);
    }, hideAfter * 1000);
    return () => clearInterval(intervalId);
  }, [hideAfter, message, title, level, show]);

  useEffect(() => {
    setShow(true);
  }, [message, title, level]);

  const colour = colours.get(level);
  const Icon = icons.get(level);

  if (message.includes(':')) [ title, message ] = message.split(':');

  return (
    <>
      <div
        aria-live="assertive"
        className="z-40 pointer-events-none fixed inset-0 flex items-end top-3 px-4 py-6 mt-12 mr-2 sm:items-start sm:p-6"
      >
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          <Transition
            show={show}
            as={Fragment}
            enter="transform ease-out duration-300 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-gray-100 shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Icon className={classnames(`text-${colour}-400`, "bg-gray-100 h-6 w-6")} aria-hidden="true" />
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">{title}</p>
                    <p className="mt-1 text-sm text-gray-500">{message}</p>
                  </div>
                  <div className="ml-4 flex flex-shrink-0">
                    <button
                      type="button"
                      className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setShow(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-5 w-5 bg-gray-100" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  )
}
