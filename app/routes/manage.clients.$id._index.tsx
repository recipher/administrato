import { redirect, type LoaderArgs } from '@remix-run/node';

export const loader = async ({ params }: LoaderArgs) => {
  const { id } = params;

  return redirect(`/manage/clients/${id}/info`);
};
