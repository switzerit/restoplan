import { io } from 'socket.io-client'

const socket = io('https://api.varman.ch', {
  autoConnect: false,
  transports: ['websocket', 'polling']
})

export default socket
