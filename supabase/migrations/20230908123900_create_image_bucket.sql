INSERT INTO
storage.buckets (id, name, public, avif_autodetection)
VALUES('images', 'images', TRUE, FALSE);

CREATE POLICY "allow insert to images"
ON storage.objects 
FOR INSERT TO public 
WITH CHECK (bucket_id = 'images');

CREATE POLICY "allow update to images"
ON storage.objects 
FOR UPDATE TO public 
WITH CHECK (bucket_id = 'images');

CREATE POLICY "allow delete to images"
ON storage.objects 
FOR DELETE TO public 
