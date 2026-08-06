import { supabase } from '@/src/lib/supabase';

// Upload a local file (fileUri from expo-image-picker) to storage and upsert DB record.
export async function uploadUserLogo(userId: string, fileUri: string) {
  if (!userId) throw new Error('Missing userId');
  const fileExt = fileUri.split('.').pop()?.split('?')[0] || 'jpg';
  const fileName = `${userId}.${fileExt}`;
  const filePath = fileName; // you can use folders like `${userId}/${fileName}`

  // fetch file as blob (works in Expo)
  const response = await fetch(fileUri);
  const blob = await response.blob();

  // upload to bucket (upsert true)
  const { error: uploadError } = await supabase.storage
    .from('user-logos')
    .upload(filePath, blob, { upsert: true });

  if (uploadError) throw uploadError;

  // get public url
  const { data } = supabase.storage.from('user-logos').getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  // upsert DB row: insert or update existing
  const { error: dbError } = await supabase
    .from('user_logos')
    .upsert({ user_id: userId, logo_url: publicUrl }, { onConflict: 'user_id' });

  if (dbError) throw dbError;

  return publicUrl;
}
