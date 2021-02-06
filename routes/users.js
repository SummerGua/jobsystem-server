var express = require('express');
var router = express.Router();
var URL = require('url')
var db = require('../database')
var tokenHandler = require('../token')
var jwp = require('express-jwt');
var timeTool = require('../myTools/getDateTime');
const { resolvePtr } = require('dns');

const jwtMW = jwp({
  secret: 'cqupt',
  algorithms: ['HS256']
})
/* GET users listing. */
router.get('/',jwtMW, (req, res) => { //使用中间件
  res.send('respond with a resource');
});

router.post('/login', (req, res) => {
  let name = req.body.name
  let password = req.body.password
  db.query(`select password,realName,isStu,uid from user where name = '${name}'`, function(err,result){ //注意这个引号
    if(err) throw err
    let response = {
      code: 0, 
      data: 'success', 
      name: '', isStu:'', uid:'', token:''
    }
    let info = result[0]
    if(!result||result.length==0) res.send({code: 1, data:'用户不存在'})
    else {
      if(password==info.password) { //若成功返回这些信息
        tokenHandler.setToken(info.uid).then(token=>{
          response.name = info.realName
          response.isStu = info.isStu
          response.uid = info.uid
          response.token = 'Bearer ' + token
          res.send(response)
        })
      }
      else{
        res.send(JSON.stringify({code:2, data:'密码错误'}))
      }
    }
  })
})

router.post('/signup',(req, res) => {
  console.log(req.body)
  let name = req.body.name
  let isStu = req.body.isStu
  let password = req.body.password //这边以后要加密
  let realName = req.body.realName
  db.query(`select * from user where name = '${name}'`, (err,result) => {
    if(err) throw err
    if(result&&result.length !== 0) {
      res.send(JSON.stringify({code: 1, data: '用户名已存在'}))
    }
    else{
      let sql = `insert into user(name,isStu,password,realName) values("${name}","${isStu}","${password}","${realName}")`
      db.query(sql,function(err,result){
          if(err) throw err
          let response = {code: 0,data: '注册成功'}
          res.send(JSON.stringify(response))
        }
      )
  }
  })
})

router.post('/saveResume', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let uid = info.uid //token里的
      let data = req.body //请求体中的数据
      let upTime = timeTool.getDateTime()
      let job = data.job
      let companyName = ''
      if(data.companyName) {
        companyName = data.companyName
      }
      let progress = 0
      let tele = data.tele
      let email = data.email
      let sex = data.sex
      let birthday = data.birthday.split('T')[0]
      let salary = data.salary
      let city = data.city
      let edu = data.edu
      let evaluation = data.evaluation
      let firstSchool = data.eduinfo.a.name
      let firstExp = data.eduinfo.a.info
      let secondSchool = '', secondExp = ''
      let thirdSchool = '', thirdExp = ''
      let workExp = ''
      if(data.secondSchool){
        secondSchool = data.eduinfo.b.name
        secondExp = data.eduinfo.b.info
      }
      if(data.thirdSchool){
        thirdSchool = data.eduinfo.c.name
        thirdExp = data.eduinfo.c.name
      }
      if(data.workExp){
        workExp = data.workExp
      }
      let sql = `insert into resume(sended,uid, upTime, job, companyName,`
      +`progress, tele, email, sex, birthday, salary, city, edu, evaluation,`
      +`firstSchool, firstExp, secondSchool, secondExp, thirdSchool, thirdExp, workExp) `
      +`values("0","${uid}","${upTime}","${job}","${companyName}","${progress}","${tele}","${email}",`
      +`"${sex}","${birthday}","${salary}","${city}","${edu}","${evaluation}",`
      +`"${firstSchool}","${firstExp}","${secondSchool}","${secondExp}","${thirdSchool}","${thirdExp}","${workExp}")`
      db.query(sql,function(err,result){
        if(err) throw err
        let response = {code: 0,data: 'submit success'}
        res.send(JSON.stringify(response))
      })
    }
  )
})

router.get('/getShortResume', jwtMW, (req, res) => {
    tokenHandler.verifyToken(req.headers.authorization).then(
      info => {
        const uid = info.uid //解析token里的uid
        let sql = `select sended,companyName,job,type,progress,upTime,sended from resume where uid=${uid} order by upTime desc`
        db.query(sql, (err, result) => {
          if(err) throw err
          let response = {
            code: 0,
            data: undefined
          }
          if(result.length==0||!result) {
            response.data = 'no data'
            res.send(JSON.stringify(response))
          }else{
            response.data = result
            res.send(JSON.stringify(response))
          }
        })
      }
    )
})

router.get('/getMessageSenders', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info =>{
      let uid = info.uid
      //用时间排序
      let sql = `select fromUid,toUid from message where fromUid="${uid}" or toUid="${uid}" order by time`
      db.query(sql, (err, result) => {
        let senderId = []
        if(err) throw err
        if(result.length==0||!result){
          res.send(JSON.stringify({code: 0, data: 'no message'}))
        }else{
          for(let i=0; i<result.length; i++){
            if(result[i].fromUid==uid){
              senderId.push(result[i].toUid)
            }else{
              senderId.push(result[i].fromUid)
            }
          }
          senderId = Array.from(new Set(senderId)) //去重防止意外情况
          let findPic = `select realName,pic,uid from user where uid in (${senderId})` //注意这种SQL方法非常巧妙
          db.query(findPic, (err, picResult) => {
            if(err) throw err
            let response = {
              code: 0,
              data: picResult
            }
            res.send(JSON.stringify(response))
          })
          
          
        }
      })
    }
  )
})

router.post('/sendMessage', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      const fromUid = info.uid
      const toUid = req.body.toUid
      let message = req.body.message
      let datetime = timeTool.getDateTime()
      let sendSql = `insert into message(fromUid,toUid,time,message) values(${fromUid},${toUid},"${datetime}","${message}")`
      db.query(sendSql, (err, result) => {
        if(err) throw err
        let response = {
          code: 0,
          data: 'send success'
        }
        res.send(JSON.stringify(response))
      })
    }
  )
})

router.post('/getMessage' ,jwtMW, (req, res) =>{
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let myuid = info.uid //获取登陆者uid
      let hisuid = req.body.hisuid
      let sql = `select message,time,fromUid from message where (fromUid="${myuid}" and toUid="${hisuid}") or (fromUid="${hisuid}" and toUid="${myuid}") order by time`
        db.query(sql, (err, result) => {
          if(err) throw err
          let response = {
            code: 0,
            data: ''
          }
          if(result.length==0||!result){
            response.code = 1
            response.data = 'no data'
            res.send(JSON.stringify(response))
          }else{
            response.data = result
            res.send(JSON.stringify(response))
          }
       })
     }
   )
})

module.exports = router;
