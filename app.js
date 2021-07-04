var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')

var app = express()

//设置跨域访问
//跨域如果想带cookie，Access-Control-Allow-Origin就不能设置为*，需要指定具体域名
app.all('*', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Authorization,token,DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type, Accept-Language, Origin, Accept-Encoding")
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS")
  res.header("Access-Control-Allow-Credentials","true")
  res.header("X-Powered-By",'3.2.1')
  res.header("Cnbontent-Type", "application/jsoncharset=utf-8")
  next()
})

var router = require('./routes/socketConnect')
app.io = router.io

//路由信息
var indexRouter = require('./routes/index')
var usersRouter = require('./routes/users')
var publicRouter = require('./routes/public')
var bbsRouter = require('./routes/bbs')

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

//设置中间件
app.use(logger('dev'))
app.use(express.json())
//应用cookie session为中间件
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

//设置静态资源托管
app.use(express.static(path.join(__dirname, 'public')))//默认

//app.use(express.static(path.join(__dirname, 'dist')))//用vue

app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/public', publicRouter)
app.use('/bbs',bbsRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})




module.exports = app
