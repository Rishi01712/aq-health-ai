// src/lib/sendTestPush.ts
import toast from 'react-hot-toast'

export const sendTestNotification = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    toast.error('Push notifications not supported')
    return
  }

  try {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification('AQ-Health AI Test', {
      body: 'Your push system is working perfectly!',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'test-alert',
      // renotify: true ← removed (not valid in NotificationOptions)
    })
    toast.success('Test notification sent!')
  } catch {
    toast.error('Notification blocked or failed')
  }
}