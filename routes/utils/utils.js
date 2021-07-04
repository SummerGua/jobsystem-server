const db = require('../../database')
module.exports = {
  makeResponse: function(result){
    return JSON.stringify({
      code: 0,
      data: result
    })
  },
  makePromise: function(sql) {
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if(err) throw err
        resolve(result)
      })
    }) 
  }
}