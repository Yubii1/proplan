import { supabase } from '@/src/lib/supabase';

export async function getUserLogo(userId: string) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('user_logos')
    .select('logo_url')
    .eq('user_id', userId)
    .single();

  if (error) {
    // if no row, return null
    return null;
  }
  return data?.logo_url || null;
}
