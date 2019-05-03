/*
使用 mongoose 操作 mongodb 的测试文件
1. 连接数据库
1.1. 引入 mongoose
1.2. 连接指定数据库 (URL 只有数据库是变化的 )
1.3. 获取连接对象
1.4. 绑定连接完成的监听 ( 用来提示连接成功 )
2. 得到对应特定集合的 Model
2.1. 字义 Schema( 描述文档结构 )
2.2. 定义 Model( 与集合对应 , 可以操作集合 )
3. 通过 Model 或其实例对集合数据进行 CRUD 操作
3.1. 通过 Model 实例的 save() 添加数据
3.2. 通过 Model 的 find()/findOne() 查询多个或一个数据
3.3. 通过 Model 的 findByIdAndUpdate() 更新某个数据
3.4. 通过 Model 的 remove() 删除匹配的数据
*/

// 1.1. 引入 mongoose
const mongoose = require('mongoose')

// 引入md5 加密用户密码
const md5 = require('blueimp-md5')
// 1.2. 连接指定数据库 (URL 只有数据库是变化的 )
mongoose.connect('mongodb://localhost:27017/gzhipin_test', { useNewUrlParser: true })
// 1.3. 获取连接对象
const conn = mongoose.connection
// 1.4. 绑定连接完成的监听 ( 用来提示连接成功 )
conn.on('connected', function () {
    console.log('数据库连接成功');

})

// 2. 得到对应特定集合的 Model
// 2.1. 字义 Schema( 描述文档结构 )
const userSchema = mongoose.Schema({ // 指定文档的结构: 属性名, 属性值, 是否必须, 默认值
    username: { type: String, required: true }, // 用户名
    password: { type: String, required: true }, // 密码
    type: { type: String, required: true }, // 用户类型 : boss/employee
})
// 2.2. 定义 Model( 与集合对应 , 可以操作集合 )
const UserModel = mongoose.model('user', userSchema) // Model(对象)是user,集合(包含user对象的数组)名称是users UserModel是构造函数

// 3. 通过 Model 或其实例对集合数据进行 CRUD 操作
// 3.1. 通过 Model 实例的 save() 添加数据
function testSave() {
    // 创建UserModel的实例
    const user_model = new UserModel({
        username: 'tom',
        password: md5('123'),
        type: 'employee',
    })

    // 调用save()保存
    user_model.save(function (error,user) {
        console.log('save()', error, user);
        
    })
}

// testSave()
// 3.2. 通过 Model 的 find()/findOne() 查询多个或一个数据
function testFind() {
    // find和findOne都是构造函数UserModel对象的方法
    // 查询多个,使用find,返回的是所有匹配文档对象的数组,没有匹配的是空数组[]
    UserModel.find(function (error,users) {
        console.log('find()',error,users)
    })
    // 查询一个,使用findOne,返回的是匹配的对象,没有匹配的是null
    UserModel.findOne({_id:'5ccbfb520137f6355c387773'},function (error,user) {
        console.log('findOne()',error,user)
    })
}
testFind()
// 3.3. 通过 Model 的 findByIdAndUpdate() 更新某个数据
// 3.4. 通过 Model 的 remove() 删除匹配的数据