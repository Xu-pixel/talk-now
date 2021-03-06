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
const rooms = new Map()

io.on('connection', socket => {
    // console.log(socket.id)

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

    socket.on('disconnecting', () => {
        socket.rooms.forEach(roomId => {
            if(roomId === socket.id)return
            rooms.set(roomId, rooms.get(roomId) - 1)
            socket.to(roomId).emit('statistic', rooms.get(roomId), roomId)
        })
    })

    socket.on('post', (roomId, ...payload) => {
        socket.to(roomId).emit('post', roomId, ...payload)
    })

    socket.on('joinRoom', (nickName, roomId) => {
        if (roomId === null) return
        socket.join(roomId)
        // console.log(socket.id, '加入', roomId)
        socket.emit('joinRoom', 'success', roomId)
        socket.to(roomId).emit('otherJoinRoom', nickName, roomId)


        //记录房间人数
        rooms.set(roomId, (rooms.get(roomId) || 0) + 1)
        // console.log(rooms.get(roomId))
        socket.to(roomId).emit('statistic', rooms.get(roomId), roomId)
        socket.emit('statistic', rooms.get(roomId), roomId)
    })
})


app.use(express.static('public'))


httpServer.listen(port, () => {
    console.log(`talknow app listening on http://localhost:${port} !`)
    for (let ip of getIP()) {
        console.log(`talknow app listening on http://${ip}:${port} !`)
    }
})
