import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { PostCm, ComentarioCm, ReacaoAgregada, Perfil } from '@/types'
import { MessageCircle, Send, Link as LinkIcon, X } from 'lucide-react'

const EMOJIS = ['👍', '🔥', '❤️', '😮', '😂', '💪']

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'agora'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function Avatar({ perfil, size = 36 }: { perfil?: Pick<Perfil, 'nome_display' | 'avatar_url' | 'username'> | null; size?: number }) {
  if (!perfil) return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--color-bg-secondary)', flexShrink: 0 }} />
  if (perfil.avatar_url) return <img src={perfil.avatar_url} alt={perfil.nome_display} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid var(--color-border)' }} />
  const hue = [...(perfil.username ?? '')].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: `hsl(${hue}, 55%, 28%)`, border: `1.5px solid hsl(${hue}, 55%, 40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: size * 0.38, color: '#fff' }}>{perfil.nome_display?.[0]?.toUpperCase() ?? '?'}</div>
}

function UrlPreview({ url }: { url: string }) {
  const ytId = extractYoutubeId(url)
  if (ytId) {
    return <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9', background: '#000', marginTop: 10 }}><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytId}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ border: 'none', display: 'block' }} /></div>
  }
  return <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', color: 'var(--color-blue-light)', fontFamily: 'DM Sans', fontSize: 13, textDecoration: 'none', wordBreak: 'break-all' }}><LinkIcon size={13} style={{ flexShrink: 0 }} />{url}</a>
}

function EmojiPicker({ onPick, existing }: { onPick: (e: string) => void; existing: string[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const available = EMOJIS.filter(e => !existing.includes(e))
  if (available.length === 0) return null
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ padding: '3px 10px', borderRadius: 20, border: '1px dashed var(--color-border)', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>+ reagir</button>
      {open && (
        <div style={{ position: 'absolute', bottom: '110%', left: 0, zIndex: 10, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '8px 10px', display: 'flex', gap: 6, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {available.map(e => <button key={e} onClick={() => { onPick(e); setOpen(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '2px 4px', borderRadius: 6 }}>{e}</button>)}
        </div>
      )}
    </div>
  )
}

function ReacoesBar({ alvoId, alvoTipo, currentUserId }: { alvoId: string; alvoTipo: 'post' | 'comentario'; currentUserId: string | null }) {
  const [reacoes, setReacoes] = useState<ReacaoAgregada[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('cm_reacoes').select('emoji, autor_id').eq('alvo_id', alvoId).eq('alvo_tipo', alvoTipo).then(({ data }) => {
      if (!data) return
      const map = new Map<string, { count: number; eu: boolean }>()
      for (const r of data) {
        const prev = map.get(r.emoji) ?? { count: 0, eu: false }
        map.set(r.emoji, { count: prev.count + 1, eu: prev.eu || r.autor_id === currentUserId })
      }
      setReacoes(EMOJIS.flatMap(e => { const v = map.get(e); return v ? [{ emoji: e, count: v.count, eu_reagi: v.eu }] : [] }))
    })
  }, [alvoId, alvoTipo, currentUserId])

  async function toggle(emoji: string) {
    if (!currentUserId || loading) return
    setLoading(true)
    const existing = reacoes.find(r => r.emoji === emoji && r.eu_reagi)
    if (existing) {
      await supabase.from('cm_reacoes').delete().eq('alvo_id', alvoId).eq('alvo_tipo', alvoTipo).eq('autor_id', currentUserId).eq('emoji', emoji)
      setReacoes(prev => prev.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, eu_reagi: false } : r).filter(r => r.count > 0))
    } else {
      await supabase.from('cm_reacoes').insert({ alvo_id: alvoId, alvo_tipo: alvoTipo, autor_id: currentUserId, emoji })
      setReacoes(prev => { const idx = prev.findIndex(r => r.emoji === emoji); if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], count: next[idx].count + 1, eu_reagi: true }; return next } return [...prev, { emoji, count: 1, eu_reagi: true }] })
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {reacoes.map(r => <button key={r.emoji} onClick={() => toggle(r.emoji)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, cursor: currentUserId ? 'pointer' : 'default', border: r.eu_reagi ? '1.5px solid var(--color-blue-primary)' : '1px solid var(--color-border)', background: r.eu_reagi ? 'rgba(43,91,232,0.12)' : 'var(--color-bg-secondary)', fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-primary)', transition: 'all 0.15s' }}><span>{r.emoji}</span><span style={{ fontSize: 11, color: r.eu_reagi ? 'var(--color-blue-light)' : 'var(--color-text-muted)' }}>{r.count}</span></button>)}
      {currentUserId && <EmojiPicker onPick={toggle} existing={reacoes.map(r => r.emoji)} />}
    </div>
  )
}

function ComentariosSection({ postId, currentUserId, perfil }: { postId: string; currentUserId: string | null; perfil: Pick<Perfil, 'id' | 'username' | 'nome_display' | 'avatar_url'> | null }) {
  const [comentarios, setComentarios] = useState<ComentarioCm[]>([])
  const [loaded, setLoaded] = useState(false)
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    supabase.from('cm_comentarios').select('*, autor:perfis(id, username, nome_display, avatar_url)').eq('post_id', postId).order('created_at')
      .then(({ data }) => { setComentarios((data ?? []) as ComentarioCm[]); setLoaded(true) })
  }, [postId])

  async function submit() {
    if (!texto.trim() || !currentUserId || sending) return
    setSending(true)
    const { data } = await supabase.from('cm_comentarios').insert({ post_id: postId, autor_id: currentUserId, conteudo: texto.trim() }).select('*, autor:perfis(id, username, nome_display, avatar_url)').single()
    if (data) setComentarios(prev => [...prev, data as ComentarioCm])
    setTexto('')
    setSending(false)
  }

  async function deletar(id: string) {
    await supabase.from('cm_comentarios').delete().eq('id', id)
    setComentarios(prev => prev.filter(c => c.id !== id))
  }

  if (!loaded) return <div style={{ padding: '12px 0', fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-muted)' }}>Carregando...</div>

  return (
    <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {comentarios.map(c => (
        <div key={c.id} style={{ display: 'flex', gap: 10 }}>
          <Avatar perfil={c.autor} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>{c.autor?.nome_display}</span>
              <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)' }}>{tempoRelativo(c.created_at)}</span>
              {c.autor_id === currentUserId && <button onClick={() => deletar(c.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0 }}><X size={12} /></button>}
            </div>
            <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-secondary)', margin: '2px 0 4px', lineHeight: 1.5, wordBreak: 'break-word' }}>{c.conteudo}</p>
            <ReacoesBar alvoId={c.id} alvoTipo="comentario" currentUserId={currentUserId} />
          </div>
        </div>
      ))}
      {currentUserId ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Avatar perfil={perfil} size={28} />
          <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }} placeholder="Escreva um comentário..." rows={1} maxLength={500} style={{ flex: 1, resize: 'none', padding: '8px 12px', borderRadius: 20, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: 13, outline: 'none', lineHeight: 1.5 }} />
            <button onClick={submit} disabled={!texto.trim() || sending} style={{ background: 'var(--color-blue-primary)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: texto.trim() ? 'pointer' : 'not-allowed', opacity: texto.trim() ? 1 : 0.4, flexShrink: 0 }}><Send size={14} color="#fff" /></button>
          </div>
        </div>
      ) : (
        <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)' }}><Link to="/login" style={{ color: 'var(--color-blue-light)' }}>Entre</Link> para comentar.</p>
      )}
    </div>
  )
}

function PostCard({ post, currentUserId, perfil, onDelete }: { post: PostCm; currentUserId: string | null; perfil: Pick<Perfil, 'id' | 'username' | 'nome_display' | 'avatar_url'> | null; onDelete: (id: string) => void }) {
  const [comentariosAberto, setComentariosAberto] = useState(false)
  const [numComentarios, setNumComentarios] = useState<number | null>(null)

  useEffect(() => {
    supabase.from('cm_comentarios').select('id', { count: 'exact', head: true }).eq('post_id', post.id).then(({ count }) => setNumComentarios(count ?? 0))
  }, [post.id])

  async function deletarPost() {
    await supabase.from('cm_posts').delete().eq('id', post.id)
    onDelete(post.id)
  }

  return (
    <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Avatar perfil={post.autor} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>{post.autor?.nome_display ?? 'Blader'}</div>
          <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)' }}>@{post.autor?.username} · {tempoRelativo(post.created_at)}</div>
        </div>
        {post.autor_id === currentUserId && <button onClick={deletarPost} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, borderRadius: 6 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-danger)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}><X size={15} /></button>}
      </div>
      <p style={{ fontFamily: 'DM Sans', fontSize: 15, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.conteudo}</p>
      {post.url && <UrlPreview url={post.url} />}
      <ReacoesBar alvoId={post.id} alvoTipo="post" currentUserId={currentUserId} />
      <button onClick={() => setComentariosAberto(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-muted)', padding: 0 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
        <MessageCircle size={14} />
        {numComentarios !== null ? `${numComentarios} comentário${numComentarios !== 1 ? 's' : ''}` : 'Comentários'}
      </button>
      {comentariosAberto && <ComentariosSection postId={post.id} currentUserId={currentUserId} perfil={perfil} />}
    </div>
  )
}

function NovoPostForm({ currentUserId, perfil, onPost }: { currentUserId: string; perfil: Pick<Perfil, 'id' | 'username' | 'nome_display' | 'avatar_url'> | null; onPost: (post: PostCm) => void }) {
  const [conteudo, setConteudo] = useState('')
  const [url, setUrl] = useState('')
  const [showUrl, setShowUrl] = useState(false)
  const [sending, setSending] = useState(false)

  async function submit() {
    if (!conteudo.trim() || sending) return
    setSending(true)
    const payload: { autor_id: string; conteudo: string; url?: string } = { autor_id: currentUserId, conteudo: conteudo.trim() }
    if (url.trim()) payload.url = url.trim()
    const { data } = await supabase.from('cm_posts').insert(payload).select('*, autor:perfis(id, username, nome_display, avatar_url)').single()
    if (data) onPost(data as PostCm)
    setConteudo(''); setUrl(''); setShowUrl(false); setSending(false)
  }

  return (
    <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 12 }}>
      <Avatar perfil={perfil} size={40} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <textarea value={conteudo} onChange={e => setConteudo(e.target.value)} placeholder="O que está acontecendo no mundo Beyblade?" rows={3} maxLength={2000} style={{ resize: 'vertical', padding: '10px 14px', borderRadius: 10, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: 14, outline: 'none', lineHeight: 1.6, width: '100%', boxSizing: 'border-box' }} onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-blue-primary)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')} />
        {showUrl && <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Cole um link ou URL de vídeo (YouTube, etc.)..." style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setShowUrl(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 13, color: showUrl ? 'var(--color-blue-light)' : 'var(--color-text-muted)', padding: 0 }}><LinkIcon size={14} />{showUrl ? 'Remover link' : 'Adicionar link'}</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: conteudo.length > 1800 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>{conteudo.length}/2000</span>
            <button onClick={submit} disabled={!conteudo.trim() || sending} style={{ background: 'var(--color-blue-primary)', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 20px', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: conteudo.trim() ? 'pointer' : 'not-allowed', opacity: conteudo.trim() ? 1 : 0.5 }}>{sending ? 'Postando...' : 'Postar'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props { initialPosts: PostCm[]; currentUserId: string | null }

export function ComunidadeFeed({ initialPosts, currentUserId }: Props) {
  const [posts, setPosts] = useState<PostCm[]>(initialPosts)
  const [perfil, setPerfil] = useState<Pick<Perfil, 'id' | 'username' | 'nome_display' | 'avatar_url'> | null>(null)

  useEffect(() => {
    if (!currentUserId) return
    supabase.from('perfis').select('id, username, nome_display, avatar_url').eq('id', currentUserId).single()
      .then(({ data }) => { if (data) setPerfil(data) })
  }, [currentUserId])

  useEffect(() => {
    const channel = supabase.channel('cm_posts_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cm_posts' }, async payload => {
        if (posts.some(p => p.id === payload.new.id)) return
        const { data } = await supabase.from('cm_posts').select('*, autor:perfis(id, username, nome_display, avatar_url)').eq('id', payload.new.id).single()
        if (data) setPosts(prev => [data as PostCm, ...prev])
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [posts])

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '36px 16px 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Rajdhani', fontSize: 28, fontWeight: 700, margin: 0 }}>Comunidade</h1>
        <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Compartilhe batalhas, vídeos e novidades do mundo Beyblade</p>
      </div>
      {currentUserId ? (
        <div style={{ marginBottom: 20 }}><NovoPostForm currentUserId={currentUserId} perfil={perfil} onPost={p => setPosts(prev => [p, ...prev])} /></div>
      ) : (
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, fontFamily: 'DM Sans', fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--color-blue-light)', fontWeight: 600 }}>Entre</Link> para participar da comunidade.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 14, fontFamily: 'DM Sans', color: 'var(--color-text-muted)' }}>Nenhuma postagem ainda. Seja o primeiro!</div>
        ) : posts.map(p => <PostCard key={p.id} post={p} currentUserId={currentUserId} perfil={perfil} onDelete={id => setPosts(prev => prev.filter(x => x.id !== id))} />)}
      </div>
    </div>
  )
}
