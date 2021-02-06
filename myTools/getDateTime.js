//方便插入数据库中
exports.getDateTime = function(){
  let date = new Date()
  let month = date.getMonth()+1
  let upTime = date.getFullYear()+'-'+month+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()
  return upTime
}