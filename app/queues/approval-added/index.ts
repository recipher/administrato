import { CourierClient } from '@trycourier/courier';
import ApprovalsService from '~/services/scheduler/approvals.server';

const authorizationToken = process.env.COURIER_AUTH_TOKEN!
const courier = CourierClient({ authorizationToken });

export async function handler (event: any) {
  await Promise.all(event.Records.map(async ({ body }: { body: any }) => {
    const { setId, userId, userData, meta: { user }} = JSON.parse(body);

    if (userData == null) return;

    await courier.replaceProfile({
      recipientId: userId,
      profile: {
        email: userData.email,
        name: userData.name,
      }
    });

    await courier.send({
      message: { 
        to: { 
          user_id: userId, 
          courier: { channel: userId }, 
          data: { name: user.name, schedules: [
            { name: "January", year: "2023" },
            { name: "February", year: "2023" },
          ] 
        }},
        content: {
          "elements": [
            {
              "type": "meta",
              "title": "Schedule Approvals Pending 2"
            },
            {
              "type": "text",
              "content": "Hello {{name}}, you have pending schedule approvals."
            },
            {
              "type": "text",
              "content": "* {{$.item.name}} {{$.item.year}}",
              "loop": "data.schedules",
            },
          ],
          "version": "2022-01-01",
        },
        routing: {
          method: "all", channels: [ "inbox", "email" ]
        }
      }
    });
  }));
};