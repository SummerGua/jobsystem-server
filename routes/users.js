var express = require('express');
var router = express.Router();
var URL = require('url')
var db = require('../database')
var tokenHandler = require('../token')
var jwp = require('express-jwt');
var timeTool = require('../myTools/getDateTime');
const { resolvePtr } = require('dns');
const { token } = require('morgan');

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
  let name = req.body.name
  let isStu = req.body.isStu
  let password = req.body.password //这边以后要加密
  let realName = req.body.realName
  let companyName = req.body.companyName
  db.query(`select * from user where name = '${name}'`, (err,result) => {
    if(err) throw err
    if(result&&result.length !== 0) {
      res.send(JSON.stringify({code: 1, data: '用户名已存在'}))
    }
    else{
      let sql = `insert into user(name,isStu,password,realName,companyName) `
      +`values("${name}","${isStu}","${password}","${realName}","${companyName}")`
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
      let name = data.name
      let tele = data.tele
      let email = data.email
      let sex = data.sex
      let birthday = data.birthday.split('T')[0]
      let salary = data.salary
      let city = data.city
      let diploma = data.diploma
      let evaluation = data.evaluation
      let eduinfos = []
      let workExps = []
      let skills = ''
      let projects = []

      for(let i=0;i<6;i++){
        if(data.eduinfo[i]){
          eduinfos.push(
            [
              data.eduinfo[i].name,
              data.eduinfo[i].info,
              data.eduinfo[i].major,
              data.eduinfo[i].lasttime,
              data.eduinfo[i].rank,
              data.eduinfo[i].degree
            ]
          )
        }else{
          eduinfos.push(
            ['','','','','','']
          )
        }
      }
      
      for(let j=0;j<5;j++){
        if(data.workExp[j]){
          workExps.push(
            [
              data.workExp[j].company,
              data.workExp[j].time,
              data.workExp[j].info,
            ]
          )
        }else{
          workExps.push(
            ['','','']
          )
        }
      }

      for(let k=0;k<7;k++){
        if(data.project[k]){
          projects.push(
            [
              data.project[k].name,
              data.project[k].info,
              data.project[k].time,
            ]
          )
        }else{
          projects.push(
            ['','','']
          )
        }
      }

      if(data.skills){
        skills = data.skills
      }
      let sql = `insert into resume(sended,uid, upTime, name, job, companyName,`
      +`progress, tele, email, sex, birthday, salary, city, diploma, evaluation, skills,`

      +`oneSchool, oneExp, oneMajor, oneTime, oneRank, oneDiploma,`
      +`twoSchool, twoExp, twoMajor, twoTime, twoRank, twoDiploma,`
      +`threeSchool, threeExp, threeMajor, threeTime, threeRank, threeDiploma,`
      +`fourSchool, fourExp, fourMajor, fourTime, fourRank, fourDiploma,`
      +`fiveSchool, fiveExp, fiveMajor, fiveTime, fiveRank, fiveDiploma,`
      +`sixSchool, sixExp, sixMajor, sixTime, sixRank, sixDiploma,`

      +`one_work_name, one_work_time,one_work_info, `
      +`two_work_name, two_work_time,two_work_info, `
      +`three_work_name, three_work_time,three_work_info, `
      +`four_work_name, four_work_time,four_work_info, `
      +`five_work_name, five_work_time,five_work_info, `

      +`one_pro_name, one_pro_info, one_pro_time, `
      +`two_pro_name, two_pro_info, two_pro_time, `
      +`three_pro_name, three_pro_info, three_pro_time, `
      +`four_pro_name, four_pro_info, four_pro_time, `
      +`five_pro_name, five_pro_info, five_pro_time, `
      +`six_pro_name, six_pro_info, six_pro_time, `
      +`seven_pro_name, seven_pro_info, seven_pro_time) `

      +`values("0","${uid}","${upTime}","${name}","${job}","${companyName}","${progress}","${tele}","${email}",`
      +`"${sex}","${birthday}","${salary}","${city}","${diploma}","${evaluation}","${skills}",`
      +`"${eduinfos[0][0]}","${eduinfos[0][1]}","${eduinfos[0][2]}","${eduinfos[0][3]}","${eduinfos[0][4]}","${eduinfos[0][5]}",`
      +`"${eduinfos[1][0]}","${eduinfos[1][1]}","${eduinfos[1][2]}","${eduinfos[1][3]}","${eduinfos[1][4]}","${eduinfos[1][5]}",`
      +`"${eduinfos[2][0]}","${eduinfos[2][1]}","${eduinfos[2][2]}","${eduinfos[2][3]}","${eduinfos[2][4]}","${eduinfos[2][5]}",`
      +`"${eduinfos[3][0]}","${eduinfos[3][1]}","${eduinfos[3][2]}","${eduinfos[3][3]}","${eduinfos[3][4]}","${eduinfos[3][5]}",`
      +`"${eduinfos[4][0]}","${eduinfos[4][1]}","${eduinfos[4][2]}","${eduinfos[4][3]}","${eduinfos[4][4]}","${eduinfos[4][5]}",`
      +`"${eduinfos[5][0]}","${eduinfos[5][1]}","${eduinfos[5][2]}","${eduinfos[5][3]}","${eduinfos[5][4]}","${eduinfos[5][5]}",`

      +`"${workExps[0][0]}","${workExps[0][1]}","${workExps[0][2]}",`
      +`"${workExps[1][0]}","${workExps[1][1]}","${workExps[1][2]}",`
      +`"${workExps[2][0]}","${workExps[2][1]}","${workExps[2][2]}",`
      +`"${workExps[3][0]}","${workExps[3][1]}","${workExps[3][2]}",`
      +`"${workExps[4][0]}","${workExps[4][1]}","${workExps[4][2]}",`

      +`"${projects[0][0]}","${projects[0][1]}","${projects[0][2]}",`
      +`"${projects[1][0]}","${projects[1][1]}","${projects[1][2]}",`
      +`"${projects[2][0]}","${projects[2][1]}","${projects[2][2]}",`
      +`"${projects[3][0]}","${projects[3][1]}","${projects[3][2]}",`
      +`"${projects[4][0]}","${projects[4][1]}","${projects[4][2]}",`
      +`"${projects[5][0]}","${projects[5][1]}","${projects[5][2]}",`
      +`"${projects[6][0]}","${projects[6][1]}","${projects[6][2]}"` + `)`
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
        let sql = `select rid,sended,companyName,job,type,progress,upTime,sended from resume where uid=${uid} order by upTime desc`
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
    info => {
      let uid = info.uid
      //用时间排序
      let sql = `select fromUid,toUid from message where fromUid="${uid}" or toUid="${uid}" order by time`
      db.query(sql, (err, result) => {
        let senderId = []
        if(err) throw err
        if(result.length==0||!result){
          res.send(JSON.stringify({code: 1, data: ''}))
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

router.post('/getMessage', jwtMW, (req, res) =>{
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
            response.data = ''
            res.send(JSON.stringify(response))
          }else{
            response.data = result
            res.send(JSON.stringify(response))
          }
       })
     }
   )
})

router.get('/getFullResume', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let rid = req.query.rid
      let sql = `select * from resume where rid="${rid}"`
      db.query(sql, (err, result) => {
        if(err) throw err
        let response = {
          code: 0,
          data: result,
        }
        res.send(JSON.stringify(response))
      })
    }
  )
})

router.get('/getReceivedResume', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let uid = info.uid
      let sql = `select * from resume where touid="${uid}" and progress=0`
      db.query(sql, (err, result) => {
        if(err) throw err
        let response = {
          code: 0,
          data: result,
          length: result.length
        }
        res.send(JSON.stringify(response))
      })
    }
  )
})

router.post('/dropResume', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let uid = info.uid
      let rid = req.body.rid
      let sql = `update resume set progress=1 where toUid=${uid} and rid=${rid}`
      db.query(sql, (err, result) => {
        if(err) throw err
        let response = {
          code: 0,
          data: 'success'
        }
        res.send(JSON.stringify(response))
      })
    }
  )
})

router.post('/wantResume', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let uid = info.uid
      let rid = req.body.rid
      let sql = `update resume set progress=2 where toUid=${uid} and rid=${rid}`
      db.query(sql, (err, result) => {
        if(err) throw err
        let response = {
          code: 0,
          data: 'success'
        }
        res.send(JSON.stringify(response))
      })
    }
  )
})

router.get('/getProcessedResumes', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let uid = info.uid
      let sql = `select * from resume where progress <> 0 and toUid=${uid}`
      db.query(sql, (err,result) => {
        if(err) throw err
        let response = {
          code: 0,
          data: result
        }
        res.send(JSON.stringify(response))
      })
    }
  )
})

router.post('/newJob', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let uid = info.uid
      let sql_one = `select cid from user where uid = ${uid}`
      db.query(sql_one, (err, result) => {
        if(err) throw err
        let cid = result[0].cid
        let body = req.body
        let jobname = body.jobname
        let salary = body.salary
        let city = body.city
        let diploma = body.diploma
        let exp = body.exp
        let description = body.description
        let skills = body.skills
        let sql = `insert into jobs(cid, jobname, salary, city, diploma, exp, description, uid,skills)`
        +` values(${cid}, "${jobname}", "${salary}", "${city}", "${diploma}", "${exp}", "${description}", ${uid}, "${skills}")`
        db.query(sql, (err, result) => {
          if(err) throw err
          let response = {
            code: 0,
            data: result
          }
          res.send(JSON.stringify(response))
        })
      })
    }
  )
})

router.post('/confirmComCode', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let uid = info.uid
      let sql_one = `select cid from user where uid = ${uid}`
      db.query(sql_one, (err, result) => {
        if(err) throw err
        let cid = result[0].cid
        let sql_two = `select code from companyinfo where cid = ${cid}`
        db.query(sql_two, (err, result) => {
          if(err) throw err
          let response = {
            code: 0,
            data: ''
          }
          if(req.body.code==result[0].code){
            response.data = 'success'
            res.send(JSON.stringify(response))
          }else{
            response.code = 1
            response.data = 'wrong code'
            res.send(JSON.stringify(response))
          }
        })
      })
    }
  )
  
})

router.get('/getJobs', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let uid = info.uid
      let sql = `select * from jobs where uid = ${uid}`
      db.query(sql, (err, result) => {
        if(err) throw err
        let response = {
          code: 0,
          data: result
        }
        res.send(JSON.stringify(response))
      })
    }
  )
})

router.post('/removeJob', jwtMW, (req, res) => {
  let jid = req.body.jid
  let sql = `delete from jobs where jid = ${jid}`
  db.query(sql, (err, result) => {
    if(err) throw err
    let response = {
      code: 0,
      data: result
    }
    res.send(JSON.stringify(response))
  })
})

module.exports = router;
