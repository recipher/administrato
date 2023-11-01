import DocumentsService from '~/services/manage/documents.server';

export async function handler (event: any) {
  await Promise.all(event.Records.map(async ({ body }: { body: any }) => {
    const { documentId, meta: { user }} = JSON.parse(body);

    await DocumentsService(user).recordDownload({ documentId });
  }));
};