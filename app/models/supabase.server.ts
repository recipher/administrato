import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './settings.server';
import { UploadHandler } from '@remix-run/node';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function convertToFile(data: AsyncIterable<Uint8Array>) {
  const chunks = [];
  for await (const chunk of data) {
    chunks.push(chunk);
  }

  const sharp = (await import("sharp")).default;

  return sharp(Buffer.concat(chunks))
    .rotate()
    .resize({
      height: 200,
      width: 200,
      fit: sharp.fit.cover,
      position: sharp.strategy.attention,
      withoutEnlargement: true,
    })
    .toBuffer();
};

const getPublicFileURL = (filePath: string, bucket: string) => {
  const { data: url } = supabase
    .storage.from(bucket)
    .getPublicUrl(filePath);

  return url.publicUrl;
};

type UploadOptions = {
  bucket: string;
  filename: string;
  contentType: string;
};

async function uploadFile(data: AsyncIterable<Uint8Array>, { filename, contentType, bucket }: UploadOptions) {
  const file = await convertToFile(data);

  const { error } = await supabase
    .storage.from(bucket)
    .upload(filename, file, { contentType });

  if (error) throw error;

  return getPublicFileURL(filename, bucket);
};

export function createSupabaseUploadHandler({ bucket }: { bucket: string }): UploadHandler {
  return async ({ filename, data, contentType }) => {
    if (filename?.length === 0) return "";
    if (!filename) return undefined;

    return uploadFile(data, {
      filename: randomUUID(), contentType, bucket
    });
  };
};

export default supabase;