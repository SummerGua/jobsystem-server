const express = require('express')
const router = express.Router()
const URL = require('url')
const db = require('../database')
const tokenHandler = require('../token')
const jwp = require('express-jwt')
const timeTool = require('../myTools/getDateTime')
const { makeResponse } = require('./utils/utils')

const jwtMW = jwp({
  secret: 'cqupt',
  algorithms: ['HS256']
})
/* GET users listing. */
router.get('/',jwtMW, (req, res) => { //使用中间件
  res.send('respond with a resource')
})

router.post('/login', (req, res) => {
  let name = req.body.name
  let password = req.body.password
  db.query(`select password,name,isStu,uid from users where name = '${name}'`, (err,result) => { //注意这个引号
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
          
          response.name = info.name
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
  // password记得加密
  let {
    name, isStu, password, realName, companyName
  } = req.body
  db.query(`select * from users where name = '${name}'`, (err,result) => {
    if(err) throw err
    if(result&&result.length !== 0) {
      res.send(JSON.stringify({code: 1, data: '用户名已存在'}))
    }
    else{
      let sql = `insert into user(name,isStu,password,realName,companyName) `
      +`values("${name}","${isStu}","${password}","${realName}","${companyName}")`
      db.query(sql, (err,result) => {
          if(err) throw err
          res.send(makeResponse('注册成功'))
        }
      )
  }
  })
})

router.post('/changePassword', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info 
      let { oldPwd, newPwd } = req.body
      let checkSql = `select password from users where uid=${uid}`
      db.query(checkSql, (err, result) => {
        if(err) throw err
        if(result[0].password !== oldPwd) {
          res.send(JSON.stringify({code: 1, data: '原有密码输入错误'}))
        }
        else {
          let sql = `update password set name='${newPwd}' where uid = ${uid}`
          db.query(sql, (err, result) => {
            if(err) throw err
            res.send(makeResponse('ok'))
          })
        }
      })
      
    }
  )
})

router.post('/changeName', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
      let { name } = req.body
      let sql = `update users set name='${name}' where uid = ${uid}`
      db.query(sql, (err, result) => {
        if(err) throw err
        res.send(makeResponse('ok'))

      })
    }
  )
})

router.post('/saveResume', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let uid = info.uid //token里的
      let data = req.body //请求体中的数据
      let upTime = timeTool.getDateTime()
      let companyName = ''
      if(data.companyName) {
        companyName = data.companyName
      }
      let progress = 0
      let {
        name, tele, email, sex, job,
        salary, city, diploma, evaluation
      } = data
      let birthday = data.birthday.split('T')[0]
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
      db.query(sql, (err,result) => {
        if(err) throw err
        res.send(makeResponse('submit success'))
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
          if(result.length==0||!result) {
            res.send(makeResponse('no data'))
          }else{

            res.send(makeResponse(result))
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
          let findPic = `select realName,pic,uid,name from users where uid in (${senderId})` //注意这种SQL方法非常巧妙
          db.query(findPic, (err, picResult) => {
            if(err) throw err
            res.send(makeResponse(picResult))
          })
          
        }
      })
    }
  )
})

router.post('/sendMessage', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      const { uid } = info
      let { toUid, message } = req.body
      let datetime = timeTool.getDateTime()
      let sendSql = `insert into message(fromUid,toUid,time,message) values(${uid},${toUid},"${datetime}","${message}")`
      db.query(sendSql, (err, result) => {
        if(err) throw err
        res.send(makeResponse('send success'))
      })
    }
  )
})

router.post('/getMessage', jwtMW, (req, res) =>{
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let myuid = info.uid //获取登陆者uid
      let { hisuid } = req.body
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
            res.send(makeResponse(result))
          }
       })
     }
   )
})

router.get('/getFullResume', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { rid } = req.query
      let sql = `select * from resume where rid="${rid}"`
      db.query(sql, (err, result) => {
        if(err) throw err
        res.send(makeResponse(result))
      })
    }
  )
})

router.get('/getReceivedResume', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
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
      let { uid } = info
      let { rid } = req.body
      let sql = `update resume set progress=1 where toUid=${uid} and rid=${rid}`
      db.query(sql, (err, result) => {
        if(err) throw err
        res.send(makeResponse('success'))
      })
    }
  )
})

router.post('/wantResume', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
      let { rid } = req.body
      let sql = `update resume set progress=2 where toUid=${uid} and rid=${rid}`
      db.query(sql, (err, result) => {
        if(err) throw err
        res.send(makeResponse('success'))
      })
    }
  )
})

router.get('/getProcessedResumes', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
      let sql = `select * from resume where progress <> 0 and toUid=${uid}`
      db.query(sql, (err,result) => {
        if(err) throw err
        res.send(makeResponse(result))
      })
    }
  )
})

router.post('/newJob', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
      let sql_one = `select cid from users where uid = ${uid}`
      db.query(sql_one, (err, result) => {
        if(err) throw err
        let { body } = req
        let {
          jobname, salary, city, 
          diploma, exp, description, skills
        } = body
        let upTime = timeTool.getDateTime()
        let { cid } = result[0]
        let sql = `insert into jobs(cid, jobname, salary, city, diploma, exp, description, uid,skills,upTime)`
        +` values(${cid}, "${jobname}", "${salary}", "${city}", "${diploma}", "${exp}", "${description}", ${uid}, "${skills}", "${upTime}")`
        db.query(sql, (err, result) => {
          if(err) throw err
          res.send(makeResponse(result))
        })
      })
    }
  )
})

router.post('/confirmComCode', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
      let sql_one = `select cid from users where uid = ${uid}`
      db.query(sql_one, (err, result) => {
        if(err) throw err
        let { cid } = result[0]
        let sql_two = `select code from companyinfo where cid = ${cid}`
        db.query(sql_two, (err, result) => {
          if(err) throw err
          let response = {
            code: 0,
            data: ''
          }
          if(req.body.code==result[0].code){
            res.send(makeResponse('success'))
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
      let { uid } = info
      let sql = `select * from jobs where uid = ${uid}`
      db.query(sql, (err, result) => {
        if(err) throw err
        res.send(makeResponse(response))
      })
    }
  )
})

router.post('/removeJob', jwtMW, (req, res) => {
  let { jid } = req.body
  let sql = `delete from jobs where jid = ${jid}`
  db.query(sql, (err, result) => {
    if(err) throw err
    res.send(makeResponse(result))
  })
})

//投递
router.post('/sendResume', jwtMW, (req, res) => {
  let { rid, uid, jid, cn} = req.body
  let sql = `update resume set sended=1,toUid=${uid},jid=${jid},companyName="${cn}" where rid=${rid}`
  db.query(sql, (err, result) => {
    if(err) throw err
    res.send(makeResponse('success'))
  })
})

const fs = require('fs')
const formidable = require('formidable')
const path = require('path')
//上传图片
router.post('/uploadPic',jwtMW,  (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      const form = new formidable.IncomingForm()
      form.keepExtensions=true
      let oldPath = path.resolve(__dirname + '../../public/avators/')
      form.uploadDir = oldPath
      let newPath = oldPath+'/'+info.uid+'.jpg'
      let sql = `update users set pic='http://localhost:3000/avators/${info.uid}.jpg' where uid=${info.uid}`
      form.parse(req, function (err, fields, files) {
        if (err) {
          res.send('-1')
        }
        fs.rename(files.file.path, newPath, err => {
          if(err) throw err
        })
        db.query(sql, (err, result) => {
          if(err) throw err
          res.send(makeResponse('ok'))
        })
      })
      
    }

     
    
  )
})

module.exports = router;
