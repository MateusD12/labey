import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

export function usePushNotifications() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission !== 'granted') return
    void ensureSubscribed(user.id)
  }, [user])

  return { requestPermission }
}

async function ensureSubscribed(userId: string) {
  try {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    if (existing) {
      await saveSubscription(userId, existing)
      return
    }
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string
    if (!vapidKey) return
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
    })
    await saveSubscription(userId, sub)
  } catch {
    // permission denied or unsupported
  }
}

async function saveSubscription(userId: string, sub: PushSubscription) {
  const json = sub.toJSON()
  await supabase.from('push_subscriptions').upsert({
    blade_id: userId,
    endpoint: json.endpoint!,
    p256dh: json.keys!.p256dh!,
    auth: json.keys!.auth!,
  }, { onConflict: 'blade_id' })
}

export async function requestPermission(userId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false
  await ensureSubscribed(userId)
  return true
}
