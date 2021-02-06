const mysql = require('mysql')
const $db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'gaga',
  database: 'jobdata'
})
//使用连接池
module.exports = {
  query: function(sql, callback){
    $db.getConnection(function(err,connection){
      if(err) throw err
      else connection.query(sql,callback)
      connection.release()
    })
    
  }
}