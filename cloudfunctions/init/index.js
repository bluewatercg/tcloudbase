const tcb = require("@cloudbase/node-sdk");

const cloud = tcb.init({
  env: "env-xcskdich",
});
const db = cloud.database();
const _ = db.command;
// exports.main = async (event, context) => {
//   let res = {};
//   const auth = cloud.auth().getUserInfo();
//   const uid = auth.uid;
//   res.list = (await db.collection('advice').where({
//     _openid:uid
//   }).get()).data;
//   res.code = 0;
//   return res;
// };

const pagesize = 100;
exports.main = async (event, context) => {
  let res = {};
  const auth = cloud.auth().getUserInfo();
  const uid = auth.uid;
  if(uid!=null){
    const ids = (await db.collection('admin').where({
        _id:uid
      }).get()).data;
      if(ids.length!=0){
        console.log(ids[0]);
        const countResult = await db.collection('advice').count();
          // 获得数据库总条数
        const total = countResult.total;
          // 计算分页次数
        const batchTimes = Math.ceil(total / pagesize);
        const tasks = []
        // 循环添加 Promise 请求
        for (let i = 0; i < batchTimes; i++) {
          const promise = await db.collection('advice').skip(i * pagesize).limit(pagesize).orderBy('adddue', 'desc').get();
          tasks.push(promise);
        }
        res.list = (await Promise.all(tasks)).reduce((acc, cur) => {
           // 使用 reduce 拼接请求结果
          return {
            data: acc.data.concat(cur.data),
            errMsg: acc.errMsg,
          }
        }).data;
        res.code = 0;
      }
      else{
        res.code = 1;
      }
  }
  else{
    res.code = 404;
  }
  return res;
};

 