import { redirect, type LoaderArgs } from '@remix-run/node';

export const loader = async ({ params }: LoaderArgs) => {
  return redirect(`/manage/security-groups`);
};
