import { Link } from '@remix-run/react';

type Props = {
  message?: string;
  error?: string;
  code?: number;
};

export default function Error({ message = "Unexpected Error", error, code = 500 }: Props) {
  return (
    <>
      <main className="mx-auto flex w-full max-w-7xl flex-auto flex-col justify-center px-0 py-0">
        <p className="text-base font-semibold leading-8 text-indigo-600">{code}</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-5xl">{message}</h1>
        <p className="mt-6 text-base leading-7 text-gray-600">{error}.</p>
        <div className="mt-10">
          <Link
            to="/"
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 mr-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Go back home
          </Link>
          <Link to="/contact" className="text-sm font-medium text-gray-900">
            Contact support <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </main>
    </>
  );
}
