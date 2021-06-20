var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Express' });
});

// router.get('/test', (req, res) => {

// })

module.exports = router;
