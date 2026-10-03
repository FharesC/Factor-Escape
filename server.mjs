import { createServer } from 'node:http'
import next from 'next'
import { WebSocketServer } from 'ws'
import { handleEvent, register, unregister } from './lib/game-realtime.ts'

const dev = process.argv.includes('--dev')
const port = Number(process.env.PORT || 3000)
const hostname = process.env.HOST || '0.0.0.0'
const app = next({ dev, hostname, port, webpack: true })
const handle = app.getRequestHandler()

await app.prepare()
const server = createServer((request, response) => handle(request, response))
const sockets = new WebSocketServer({ noServer: true })
const handleNextUpgrade = app.getUpgradeHandler()

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '/', `http://${request.headers.host}`).pathname
  if (pathname === '/api/ws') {
    sockets.handleUpgrade(request, socket, head, ws => sockets.emit('connection', ws, request))
  } else handleNextUpgrade(request, socket, head)
})

sockets.on('connection', ws => {
  register(ws)
  ws.on('message', data => {
    try { void handleEvent(ws, JSON.parse(data.toString())) }
    catch { ws.send(JSON.stringify({ type: 'reply', ok: false, error: 'Mensaje inválido.' })) }
  })
  const close = () => { void unregister(ws) }
  ws.on('close', close)
  ws.on('error', close)
})

server.listen(port, hostname, () => console.log(`> Factor Escape listo en http://localhost:${port}`))
