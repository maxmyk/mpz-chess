import io from 'socket.io-client'
const URL = 'https://mpz-chess-server.onrender.com:3001'
const socket = io(URL)
export {
    socket
}