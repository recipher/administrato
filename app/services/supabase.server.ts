import { createClient } from '@supabase/supabase-js';
import { ulid } from 'ulid';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './settings.server';
import { UploadHandler } from '@remix-run/node';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function convertToImageFile(data: AsyncIterable<Uint8Array>) {
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

async function convertToFile(data: AsyncIterable<Uint8Array>) {
  const chunks = [];
  for await (const chunk of data) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
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

const isImage = (contentType: string) => contentType.startsWith('image');

async function uploadFile(data: AsyncIterable<Uint8Array>, { filename, contentType, bucket }: UploadOptions) {
  const convert = isImage(contentType) ? convertToImageFile : convertToFile;
  const file = await convert(data);

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
      filename: ulid(), contentType, bucket
    });
  };
};

export function download({ bucket, fileURL }: { bucket: string, fileURL: string }) {
  return supabase.storage.from(bucket).download(fileURL);
};

export default supabase;