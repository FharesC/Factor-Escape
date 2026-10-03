import { experimental_upgradeWebSocket, type WebSocketData } from '@vercel/functions'
import { handleEvent, register, unregister, type ClientEvent } from '@/lib/game-realtime'

export const runtime = 'nodejs'
export const maxDuration = 300

export function GET() {
  return experimental_upgradeWebSocket(ws => {
    register(ws)
    ws.on('message', (data: WebSocketData) => {
      try { void handleEvent(ws, JSON.parse(data.toString()) as ClientEvent) }
      catch { ws.send(JSON.stringify({ type: 'reply', ok: false, error: 'Mensaje inválido.' })) }
    })
    const close = () => { void unregister(ws) }
    ws.on('close', close)
    ws.on('error', close)
  })
}
