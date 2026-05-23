import { supabase } from '@/lib/supabase'
import type { BeybladeRow, Deck } from '@/types'

export async function fetchCatalog(): Promise<BeybladeRow[]> {
  const { data, error } = await supabase.from('beyblades').select('*').is('user_id', null)
  if (error) throw error
  return (data ?? []) as BeybladeRow[]
}

export async function fetchAllParts(): Promise<BeybladeRow[]> {
  const { data, error } = await supabase.from('beyblades').select('*')
  if (error) throw error
  return (data ?? []) as BeybladeRow[]
}

export async function fetchUserCollection(userId: string): Promise<BeybladeRow[]> {
  const { data, error } = await supabase.from('beyblades').select('*').eq('user_id', userId)
  if (error) throw error
  return (data ?? []) as BeybladeRow[]
}

export async function addUserPart(
  userId: string,
  part: Omit<BeybladeRow, 'id'>,
  file?: File,
): Promise<void> {
  let storage_url: string | undefined
  if (file) {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('beyblade-images').upload(path, file)
    if (upErr) throw upErr
    const { data: urlData } = supabase.storage.from('beyblade-images').getPublicUrl(path)
    storage_url = urlData.publicUrl
  }
  const { error } = await supabase.from('beyblades').insert({ ...part, user_id: userId, storage_url })
  if (error) throw error
}

export async function fetchUserDecks(userId: string): Promise<Deck[]> {
  const { data, error } = await supabase
    .from('decks')
    .select('data')
    .eq('user_id', userId)
    .eq('name', 'user_decks')
    .single()
  if (error && error.code !== 'PGRST116') throw error
  if (!data) return []
  return (data.data as Deck[]) ?? []
}

export async function saveUserDecks(userId: string, decks: Deck[]): Promise<void> {
  const { error } = await supabase.from('decks').upsert(
    { user_id: userId, name: 'user_decks', data: decks, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,name' },
  )
  if (error) throw error
}
