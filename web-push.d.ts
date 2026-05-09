declare module 'web-push' {
  interface PushSubscriptionKeys {
    p256dh: string
    auth: string
  }
  interface PushSubscriptionObject {
    endpoint: string
    keys: PushSubscriptionKeys
  }
  interface SendNotificationResponse {
    statusCode: number
    headers: Record<string, string>
    body: string
  }
  function setVapidDetails(subject: string, publicKey: string, privateKey: string): void
  function sendNotification(
    subscription: PushSubscriptionObject,
    payload?: string | Buffer
  ): Promise<SendNotificationResponse>
  function generateVAPIDKeys(): { publicKey: string; privateKey: string }
}
