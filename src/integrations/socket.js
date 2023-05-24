import io from 'socket.io-client'
const URL = 'https://mpz-chess-server.onrender.com'
const socket = io(URL)
export {
    socket
}