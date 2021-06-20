const express = require('express');
const router = express.Router();

let users = []
router.io = function (io) {
  io.on('connection', socket => { //服务器开启socketio
    console.log('服务器已开启socketio\n')
    socket.on('login', data => {
      users[data.id] = {
        socketId: socket.id
      }
      console.log(users)
    })
    socket.on('sendMsg', data => {
      console.log(data)
      if(users[data.to]){
        socket.to(users[data.to].socketId).emit('receive',{
          from: data.from,
          message: data.message,
          upTime: new Date()
        })
        console.log('ok')
      }
      
    })
  });
  return io;
}

module.exports = router