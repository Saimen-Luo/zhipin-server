const { ChatModel } = require('../db/models')

module.exports = function (server) {
    const io = require('socket.io')(server)

    // 监视客户端与服务器的连接
    io.on('connection', function (socket) {
        console.log('有一个客户端连接到服务器')
        socket.on('sendMsg', function ({ from, to, content }) {
            console.log('服务端收到用户向服务器发送数据', { from, to, content })
            // 处理数据(保存)
            // 准备chagnMsg的相关数据
            const chat_id = [from, to].sort().join('_') // from_to 或 to_from ，视排序结果而定
            const create_time = Date.now()
            new ChatModel({ from, to, content, chat_id, create_time }).save(function (err, chatMsg) {
                // 向客户端发送消息
                io.emit('receiveMsg', chatMsg)
            })
        })
    })
}

