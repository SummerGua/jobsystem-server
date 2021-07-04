const express = require('express')
const router = express.Router()
const db = require('../database')
const tokenHandler = require('../token')
const jwp = require('express-jwt')
const { makeResponse, makePromise } = require('./utils/utils')

const jwtMW = jwp({
  secret: 'cqupt',
  algorithms: ['HS256']
})

router.get('/getPosts', (req, res) => {
  // console.log(req.body) 这边要添加参数，如第几页
  let type = Number(req.query.type)
  let sql = ''
  if(type === 0) {
    sql = `select posts.id,posts.uid,posts.title,posts.type,posts.date,users.name from posts inner join users`+
    ` where posts.uid=users.uid order by date desc`
  } else {
    sql = `select posts.id,posts.uid,posts.title,posts.type,posts.date,users.name from posts inner join users`+
    ` where posts.uid=users.uid and type=${req.query.type} order by date desc`
  }
  db.query(sql, (err, result) => {
    if(err) throw err
    res.send(result) 
  })
})


router.get('/getAllCount', (req, res) => {
  let id = req.query.id
  let sql = `select count(id) as likesNumber from likes where postid='${id}'`
  let sql2 = `select count(id) as collectsNumber from collects where postid='${id}'`
  let sql3 = `select count(id) as repliesNumber from replies where postid='${id}'`
  Promise.all([
    makePromise(sql), makePromise(sql2), makePromise(sql3)
  ]).then(
    result => {
      let remake = [{}]
      Object.assign(remake[0], result[0][0], result[1][0], result[2][0])
      res.send(makeResponse(remake[0]))
    }
  )
})

router.post('/getMyCount', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
      let sql = `select count(id) as myCollectsCount from collects where uid=${uid}`
      let sql2 = `select count(id) as myRepliesCount from replies where uid=${uid}`
      let sql3 = `select count(id) as myPostsCount from posts where uid=${uid}`
      Promise.all([
        makePromise(sql), makePromise(sql2), makePromise(sql3)
      ]).then(
        result => {
          let remake = [{}]
          Object.assign(remake[0], result[0][0], result[1][0], result[2][0])
          res.send(makeResponse(remake[0]))
        }
      )
    }
  )
})

router.post('/getTopicInfo', (req, res) => {
  // 返回帖子信息，用户名。用于查看帖子
  let { postId } = req.body
  if(postId === undefined) return
  let sqlTopic = `select users.name,posts.* from posts inner join users where posts.id=${postId} and users.uid=posts.uid`
  db.query(sqlTopic, (err, result) => {
    if(err) throw err
    res.send(makeResponse(result[0]))
  })
  
})

router.get('/getReplies', (req, res) => {
  let id = req.query.id
  let sql = `select replies.content,replies.date,replies.uid,users.name from replies`+
    ` inner join users`+
    ` where postid=${id} and users.uid = replies.uid order by replies.date`
  db.query(sql, (err, result) => {
    if(err) throw err
    if(result.length === 0) { //没有评论
      res.send(JSON.stringify({code: 1}))
    } else {
      for(let i=0; i<result.length; i++) {
        result[i].avatorUrl = `http://localhost:3000/avators/${result[i].uid}.jpg`
        result[i].number = i+1
      }
      res.send(makeResponse(result))
    }
    
  })
})

//点赞
router.post('/likeThis', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
      let { postid, date, senderuid } = req.body
      let sql = `select * from likes where uid=${uid} and postid=${postid}`
      db.query(sql, (err, result) => {
        if(err) throw err
        if(result.length === 0) { // 没点过赞
          let sql2 = `insert into likes(uid, postid, date, senderuid)`
            +` values("${uid}", "${postid}", "${date}", "${senderuid}")`
          db.query(sql2, (err, result) => {
            if(err) throw err
            res.send(makeResponse('点赞成功'))
          })
        } else {
          let sql3 = `delete from likes where uid=${uid} and postid=${postid}`
          db.query(sql3, (err, result) => {
            if(err) throw err
            res.send(JSON.stringify({code: 1, data: '你取消了点赞！'}))
          })
        }
      })
    }
  )
})

//收藏
router.post('/collectThis', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
      let { postid, date } = req.body
      let sql = `select * from collects where uid=${uid} and postid=${postid}`
      db.query(sql, (err, result) => {
        if(err) throw err
        if(result.length === 0) { // 没收藏
          let sql2 = `insert into collects(uid, postid, date) values("${uid}","${postid}","${date}")`
          db.query(sql2, (err, result) => {
            if(err) throw err
            res.send(makeResponse('收藏成功'))
          })
        } else {
          let sql3 = `delete from collects where uid=${uid} and postid=${postid}`
          db.query(sql3, (err, result) => {
            if(err) throw err
            res.send(JSON.stringify({ code: 1, data: '取消收藏' }))
          })
        }
      })
    }
  )
})

//看看是否点赞过、收藏过
router.post('/checkLike', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
      let { postid } = req.body
      let sql = `select id from likes where postid=${postid} and uid=${uid}`
      let sql2 = `select id from collects where postid=${postid} and uid=${uid}`
      Promise.all([
        makePromise(sql), makePromise(sql2)
      ]).then(
        result => {
          let checked = {
            hasLiked: false,
            hasCollected: false
          }
          if(result[0][0] !== undefined) {
            checked.hasLiked = true
          }
          if(result[1][0] !== undefined) {
            checked.hasCollected = true
          }
          res.send(makeResponse(checked))
        }
      )
    }
  )
})

// 创作一篇文章
router.post('/makePost', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
      let { title, content, type, date } = req.body
      let sql = `insert into posts(uid, title, content, type, date) `+
      `values("${uid}", "${title}", "${content}", "${type}", "${date}")`
      db.query(sql, (err, result) => {
        if(err) throw err
        res.send(makeResponse('ok'))
      })
    }
  )
})

// 回复帖子
router.post('/makeReply', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
      let { postid, content, date, senderuid } = req.body
      let sql = `insert into replies(content, postid, uid, date, senderuid) `+
      `values("${content}", "${postid}", "${uid}", "${date}", "${senderuid}")`
      db.query(sql, (err, result) => {
        if(err) throw err
        res.send(makeResponse('ok'))
      })
    }
  )
})

// 赞我的和评论我的
router.get('/likeReplyMe', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
      console.log(uid)
      let sql = `select likes.date, likes.postid, users.name, posts.title`
        + ` from likes inner join users on users.uid=likes.uid and likes.senderuid=${uid}`
        +` inner join posts on posts.id=likes.postid`
      let sql2 = `select replies.date, replies.content, replies.postid, users.name, posts.title from replies inner join users`
        + ` on users.uid=replies.uid and replies.senderuid=${uid}`
        + ` inner join posts on posts.id=replies.postid`
        Promise.all([
          makePromise(sql), makePromise(sql2)
        ]).then(
          result => {
            // 第一个是赞 第二个是回复
            res.send(makeResponse([result[0], result[1]]))
          }
        )
    }
  )
})

router.get('/getMyPosts', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
      let sql = `select title, type, date, id from posts where uid=${uid}`
      db.query(sql, (err, result) => {
        if(err) throw err
        result.map(value => {
          value.date = value.date.toLocaleString('zh',{ hour12: false })
          value.date = value.date.split(' ')[0]
        })
        res.send(makeResponse(result))
      })
    }
  )
})

//我的收藏和回复
router.get('/getMyCollectsReplies', jwtMW, (req, res) => {
  tokenHandler.verifyToken(req.headers.authorization).then(
    info => {
      let { uid } = info
      let sql = `select collects.date,posts.title,collects.postid from collects`
        + ` inner join posts where posts.id=collects.postid and collects.uid=${uid}`
      let sql2 = `select replies.date,posts.title,replies.content,replies.postid from replies`
        + ` inner join posts where replies.uid=${uid} and posts.id=replies.postid`
      Promise.all([makePromise(sql), makePromise(sql2)]).then(
        result => {
          result[0].map(value => {
            value.date = value.date.toLocaleString('zh',{ hour12: false })
            value.date = value.date.split(' ')[0] + ' ' + value.date.split(' ')[1]
          })
          result[1].map(value => {
            value.date = value.date.toLocaleString('zh',{ hour12: false })
            value.date = value.date.split(' ')[0] + ' ' + value.date.split(' ')[1]
          })
          res.send(makeResponse([result[0], result[1]]))
        }
      )
    }
  )
})

module.exports = router
