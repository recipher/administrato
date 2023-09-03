import { redirect, type LoaderArgs } from '@remix-run/node';

export const loader = async ({ params }: LoaderArgs) => {
  const { country } = params;

  return redirect(`/holidays/${country}/holidays`);
};
