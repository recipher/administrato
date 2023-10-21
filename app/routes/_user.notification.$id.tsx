import { type LoaderArgs, json } from '@remix-run/node';
import { CourierClient } from '@trycourier/courier';
import { badRequest } from '~/utility/errors';

const courierAuthToken = process.env.COURIER_AUTH_TOKEN!;
const courier = CourierClient({ authorizationToken: courierAuthToken });

export const loader = async ({ params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest('Invalid request');
  
  const response = await courier.getMessageOutput(id);
  const message = response.results.find(r => r.channel === "email")?.content;
  
  return json({ message });
};
