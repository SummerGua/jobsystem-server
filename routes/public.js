const express = require('express')
const router = express.Router()
const db = require('../database')
const { makeResponse } = require('./utils/utils')

router.get('/getComs', (req, res) => { //首页的所有公司
  let sql = `select * from companyInfo`
  db.query(sql, (err, result)=>{
    if(err) throw err
    res.send(makeResponse(result))
  })
})
router.get('/userGetJobs', (req, res) => { //点击公司查看该公司岗位
  let cid = req.query.cid
  let sql = `select jid,jobname,salary,city,diploma,exp,description,skills,uid,upTime from jobs where cid=${cid}`
  db.query(sql, (err, result) => {
    if(err) throw err
    res.send(makeResponse(result))
  })
})

router.get('/getOneCom', (req, res) => {
  let sql = `select * from companyinfo where cid=${req.query.cid}`
  db.query(sql, (err, result) => {
    if(err) throw err
    res.send(makeResponse(result))
  })
})

module.exports = router