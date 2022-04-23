const express = require('express')
const { createServer } = require("http")
const { Server } = require("socket.io")
const app = express()
const port = 3001
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: true
    }
})
const { v4: genUuid } = require('uuid')
const getIP = require('./getIP')

const users = new Map()


io.on('connection', socket => {
    console.log(socket.id)

    socket.on('login', uuid => {
        if (users.has(uuid)) {
            socket.emit('login', '', true)
            const old_socket = users.get(uuid)
            old_socket.send('你已经在别处登录了')
            users.get(uuid).disconnect()
            users.set(uuid, socket)
            return
        }
        const new_uuid = genUuid()
        users.set(new_uuid, socket)
        socket.emit('login', new_uuid, false)
    })

    socket.on('logout', uuid => {
        logout_socket = users.get(uuid)
        users.delete(uuid)
        logout_socket.disconnect()
    })

    socket.on('disconnect', () => {
        console.log(socket.id, 'disconnect')
    })

    socket.on('post', (...payload) => {
        socket.broadcast.emit('post', ...payload)
    })
})


app.use(express.static('public'))


httpServer.listen(port, () => {
    console.log(`talknow app listening on http://localhost:${port} !`)
    for (let ip of getIP()) {
        console.log(`talknow app listening on http://${ip}:${port} !`)
    }
})
