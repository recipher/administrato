import { Link } from '@remix-run/react';

type Props = {
  message?: string;
};

export default function NotFound({ message = "Page not found" }: Props) {
  return (
    <>
      <main className="mx-auto flex w-full max-w-7xl flex-auto flex-col justify-center px-0 py-12 sm:py-32">
        <p className="text-base font-semibold leading-8 text-indigo-600">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">{message}</h1>
        <p className="mt-6 text-base leading-7 text-gray-600">Sorry, we couldn’t find what you’re looking for.</p>
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
