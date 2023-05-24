import io from 'socket.io-client'
const URL = 'http://10.10.241.46:3001'
const socket = io(URL)
export {
    socket
}