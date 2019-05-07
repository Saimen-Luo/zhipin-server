module.exports = function (server) {
    const io = require('socket.io')(server)

    // 监视客户端与服务器的连接
    io.on('connection', function (socket) {
        console.log('有一个客户端连接到服务器')
        socket.on('sendMsg', function (data) {
            console.log('服务端收到用户向服务器发送数据', data)
            // 处理数据
            data.name = data.name.toUpperCase()
            socket.emit('receiveMsg', data) // 也可以用io.emit，向所有客户端发送消息
            console.log('服务器向客户端发送消息', data)
        })
    })
}

