const jwt = require('jsonwebtoken')
const key = 'cqupt'

exports.setToken = function(uid){
  return new Promise((resolve, reject) => {
    let token = jwt.sign({
      uid: uid
    }, key, {
      algorithm: 'HS256',
      expiresIn: 60*60*24 //秒数，60*60*24*3表示3天后过期
    })
    resolve(token)
  })
}

exports.verifyToken = function(token){
  return new Promise((resolve, reject) => {
    let info = jwt.verify(token.split(' ')[1], key)
    resolve(info)
  })
}