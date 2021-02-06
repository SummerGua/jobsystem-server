var express = require('express');
var router = express.Router();
var db = require('../database')

router.get('/getComs', function(req, res){
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

module.exports = router