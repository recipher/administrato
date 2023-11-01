INSERT INTO
storage.buckets (id, name, public, avif_autodetection)
VALUES('documents', 'documents', TRUE, FALSE);

CREATE POLICY "allow insert to documents"
ON storage.objects 
FOR INSERT TO public 
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "allow update to documents"
ON storage.objects 
FOR UPDATE TO public 
WITH CHECK (bucket_id = 'documents');
