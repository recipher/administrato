import { redirect, type LoaderArgs } from '@remix-run/node';

export const loader = async ({ params }: LoaderArgs) => {
  const { id, classifier } = params;

  return redirect(`/manage/people/${classifier}/${id}/info`);
};
