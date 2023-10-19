import { CourierClient } from '@trycourier/courier';
import ApprovalsService from '~/services/scheduler/approvals.server';

const authorizationToken = process.env.COURIER_AUTH_TOKEN!
const courier = CourierClient({ authorizationToken });

export async function handler (event: any) {
  await Promise.all(event.Records.map(async ({ body }: { body: any }) => {
    const { setId, meta: { user }} = JSON.parse(body);

    const service = ApprovalsService(user);
    const approvers = await service.listApproversBySetId({ setId });

    const users = approvers.map(approver => {
      const { userId, userData } = approver;
      if (userData == null) return;
      // @ts-ignore
      return { id: userId, email: userData.email, name: userData.name };
    }).reduce((tos: Array<any>, to) => to === undefined ? tos : [ ...tos, to ], []);

    await Promise.all(users.map(async(user) => {
      return courier.replaceProfile({
        recipientId: user.id,
        profile: {
          email: user.email,
          name: user.name,
        }
      });
    }));

    const to = users.map(user => ({ 
      user_id: user.id, 
      courier: { channel: user.id },
      data: { name: user.name }
    }));

    await courier.send({
      message: { 
        to,
        content: {
          "elements": [
            {
              "type": "meta",
              "title": "Schedule Approvals Pending"
            },
            {
              "type": "text",
              "content": "Hello {{name}}, you have pending schedule approvals."
            }
          ],
          "version": "2022-01-01",
        },
        routing: {
          method: "all", channels: [ "email", "inbox" ]
        }
      }
    });
  }));
};