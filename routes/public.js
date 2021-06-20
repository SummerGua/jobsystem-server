var express = require('express');
var router = express.Router();
var db = require('../database')

router.get('/getComs', (req, res) => { //首页的所有公司
  let sql = `select * from companyInfo`
  db.query(sql, (err, result)=>{
    if(err) throw err
    let response ={
      code: 0,
      data: result
    }
    res.send(JSON.stringify(response))
  })
})
router.get('/userGetJobs', (req, res) => { //点击公司查看该公司岗位
  let cid = req.query.cid
  let sql = `select jid,jobname,salary,city,diploma,exp,description,skills,uid,upTime from jobs where cid=${cid}`
  db.query(sql, (err, result) => {
    if(err) throw err
    let response = {
      code: 0,
      data: result
    }
    res.send(JSON.stringify(response))
  })
})

router.get('/getOneCom', (req, res) => {
  let sql = `select * from companyinfo where cid=${req.query.cid}`
  db.query(sql, (err, result) => {
    if(err) throw err
    let response = {
      code: 0,
      data: result
    }
    res.send(JSON.stringify(response))
  })
})

module.exports = router