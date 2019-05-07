var express = require('express');
var router = express.Router();
const { UserModel, ChatModel } = require('../db/models')
const md5 = require('blueimp-md5')
// 设置过滤的属性
const filter = { password: 0, __v: 0 }
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

// 提供一个用户注册的接口
// a) path 为: /register
// b) 请求方式为: POST
// c) 接收 username 和 password 参数
// d) admin 是已注册用户
// e) 注册成功返回: {code: 0, data: {_id: 'abc', username: ‘xxx’, password:’123’}
// f) 注册失败返回: {code: 1, msg: '此用户已存在'}
// router.post('/register', function (req, res) {
//   // 1. 获取请求参数
//   const { username, password } = req.body
//   // 2. 处理
//   if (username === 'admin') { // 注册失败
//     // 返回响应数据(失败)
//     res.send({code: 1, msg: '此用户已存在'})
//   }else {// 注册成功
//     // 返回响应数据(成功)
//     res.send({code: 0, data: {id: 'abc', username, password}})
//   }
//   // 3. 返回响应数据
// })

// 用户注册路由
router.post('/register', function (req, res) {
  // 从请求体获取请求参数
  const { username, password, type } = req.body
  // 读取已有数据库,判断用户是否已注册;如果已经注册,返回错误信息;如果不存在,保存
  // 根据username查询
  UserModel.findOne({ username }, function (error, user) {
    // 如果有user,说明用户已注册
    if (user) {
      res.send({ code: 1, msg: '用户已注册,不能重复注册,请直接登录' })
    } else { // 用户不存在,new构造函数创建实例并保存,返回成功信息
      new UserModel({ username, type, password: md5(password) }).save(function (error, user) {
        // 生成一个 cookie(userid: user._id), 并交给浏览器保存
        res.cookie('userId', user._id, { maxAge: 1000 * 60 * 60 * 24 }) // 持久化 cookie, 浏览器会保存在本地文件
        // 返回给用户的信息,需要有_id,且为了安全不能用密码,重新封装一个data
        const data = { username, type, _id: user.id }
        res.send({ code: 0, data })
      })
    }
  })


})

// 用户登录路由
router.post('/login', function (req, res) {
  // 从请求体获取请求参数
  const { username, password } = req.body
  // 查询数据库,如果有user,登录成功,返回成功信息;如果没有;登录失败,返回错误信息
  // 过滤用户密码等不必要信息
  UserModel.findOne({ username, password: md5(password) }, filter, function (err, user) {
    if (user) { // 登录成功
      // 生成一个 cookie(userid: user._id), 并交给浏览器保存
      res.cookie('userId', user._id, { maxAge: 1000 * 60 * 60 * 24 }) // 持久化 cookie, 浏览器会保存在本地文件
      res.send({ code: 0, data: user })
    } else { // 登录失败
      res.send({ code: 1, msg: '用户名或密码错误' })
    }
  })

})

// 用户更新 完善信息路由
router.post('/update', function (req, res) {
  // 从cookies中获取用户id 如果用户登录成功，请求会携带cookies
  const userId = req.cookies.userId
  // 如果没有对应的cookie说明用户没有登录
  if (!userId) {
    return res.send({ code: 1, msg: '请先登录' })
  }
  const user = req.body // user里面没有保存_id
  UserModel.findByIdAndUpdate({ _id: userId }, user, function (err, oldUser) {
    if (!oldUser) {
      // 如果没有oldUser，说明cookie信息异常，通知浏览器删除
      res.clearCookie('userId')
      // 返回错误信息
      res.send({ code: 1, msg: '请先登录' })
    } else {
      // 更新成功，返回更新后的用户信息
      // user里面没有_id, type, username ，从oldUser取
      const { _id, type, username } = oldUser
      // 用asign方法组合user和{ _id, type, username }两个对象成为新的对象，补足缺少的属性
      // asign方法注意对象参数的顺序，如果对象的属性重复，后面的会把前面的覆盖，这里没有重复
      const data = Object.assign(user, { _id, type, username })
      res.send({ code: 0, data })
    }
  })
})

// 根据cookie中的useId获取用户信息
router.get('/user', function (req, res) {
  // 从cookies中获取用户id 如果用户登录成功，请求会携带cookies
  const userId = req.cookies.userId
  // 如果没有对应的cookie说明用户没有登录
  if (!userId) {
    return res.send({ code: 1, msg: '请先登录' })
  }
  UserModel.findOne({ _id: userId }, filter, function (err, user) {
    if (!user) {
      // 如果没有user，说明cookie信息异常，通知浏览器删除
      res.clearCookie('userId')
      // 返回错误信息
      res.send({ code: 1, msg: '请先登录' })
    } else {
      // 如果有，返回user
      res.send({ code: 0, data: user })

    }
  })

})

// 获取用户列表
router.get('/userlist', function (req, res) {
  // 从cookies中获取用户id 如果用户登录成功，请求会携带cookies
  // 如果没有对应的cookie说明用户没有登录
  const userId = req.cookies.userId
  const { type } = req.query

  if (!userId) {
    return res.send({ code: 1, msg: '请先登录' })
  }

  UserModel.find({ type }, filter, function (err, users) {
    res.send({ code: 0, data: users })
  })

})

/*
获取当前用户所有相关聊天信息列表
*/
router.get('/msglist', function (req, res) {
  // 获取 cookie 中的 userid
  const userid = req.cookies.userid
  // 查询得到所有 user 文档数组
  UserModel.find(function (err, userDocs) {
    // 用对象存储所有 user 信息 : key 为 user 的 _id, val 为 name 和 header 组成的 user 对象
    const users = {} // 对象容器
    userDocs.forEach(doc => {
      users[doc._id] = { username: doc.username, header: doc.header }
    })
    /*
    查询 userid 相关的所有聊天信息
    参数 1: 查询条件
    参数 2: 过滤条件
    参数 3: 回调函数
    */
    ChatModel.find({ '$or': [{ from: userid }, { to: userid }] }, filter, function (err,
      chatMsgs) {
      // 返回包含所有用户和当前用户相关的所有聊天消息的数据
      res.send({ code: 0, data: { users, chatMsgs } })
    })
  })
})
/*
修改指定消息为已读
*/
router.post('/readmsg', function (req, res) {
  // 得到请求中的 from 和 to
  const from = req.body.from
  const to = req.cookies.userid

  /*
  更新数据库中的 chat 数据
  参数 1: 查询条件
  参数 2: 更新为指定的数据对象
  参数 3: 是否 1 次更新多条 , 默认只更新一条
  参数 4: 更新完成的回调函数
  */
  ChatModel.update({ from, to, read: false }, { read: true }, { multi: true }, function (err,
    doc) {
    console.log('/readmsg', doc)
    res.send({ code: 0, data: doc.nModified }) // 更新的数量
  })
})

module.exports = router;
