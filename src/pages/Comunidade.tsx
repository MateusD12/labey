import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { ComunidadeFeed } from '@/components/comunidade/ComunidadeFeed'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { PostCm } from '@/types'

export default function Comunidade() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<PostCm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('cm_posts').select('*, autor:perfis(id, username, nome_display, avatar_url)').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setPosts(data as PostCm[]); setLoading(false) })
  }, [])

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Carregando...</div>
    </>
  )

  return (
    <>
      <Navbar />
      <ComunidadeFeed initialPosts={posts} currentUserId={user?.id ?? null} />
    </>
  )
}
