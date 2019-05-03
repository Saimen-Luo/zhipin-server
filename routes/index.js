var express = require('express');
var router = express.Router();
const { UserModel } = require('../db/models')
const md5 = require('blueimp-md5')

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

module.exports = router;
