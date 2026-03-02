-- Create storage bucket for CRM document attachments (photos, contracts, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'crm_documents',
  'crm_documents',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access (files served via public URL)
CREATE POLICY "Public read access for crm_documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'crm_documents');

-- Allow service role to upload (bot uses service_role key)
CREATE POLICY "Service role upload for crm_documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'crm_documents');

-- Allow service role to overwrite (upsert)
CREATE POLICY "Service role update for crm_documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'crm_documents');
