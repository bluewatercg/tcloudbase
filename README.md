## tcloudbase

##作业4
* 将教程范例（意见反馈平台DEMO）中的管理端部分的列表加载变成实时数据库监听形式触发。？


```javascript
/**
 * 加载意见列表（调用云函数：init）
 */
function initlist() {
    const db = cloud.database()
    const _ = db.command
    db.collection('advice')
        // 获取反馈不为空的数据
        .where({
            advice: _.neq("")
        })
        // 实时推送
        // 获取结果为 0 时需要清除浏览器缓存和 cookie
        .watch({
            onChange: res => {
                console.log(res.docs);
                // 处理日期对象显示异常
                let list = res.docs.map(item => {
                    item.adddue = new Date(item.adddue.$date);
                    return item;
                })
                refreshlist(list)
            },
            onError: err => {
                console.error(err);
            }
        })
}
```
 
* 用户端列表加载云函数适配超过100条的场景，采用promise all的形式进行改造，使其可以支持超过100条

```javascript
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
```


##作业5 
* 将教程范例的cloudtohttp函数使用sdk的getTempFileURL进行替换。
* util.js

```javascript
    async function cloudtohttp(src) {
    if(src==""){
        return "";
    }
    let result = await cloud.getTempFileURL({
        fileList: [src]
    }).then(rs=>{
        return rs
    })
    return result.fileList[0].tempFileURL;
    
    }

```

* index.js
```javascript
/**
 * 重新渲染意见列表
 * @param Array list 意见列表
 */
async function refreshlist(list){
 ....
    for(let n in tempitem.imgs){
        let img = document.createElement('img');
        img.src = await cloudtohttp(tempitem.imgs[n]);
        img.setAttribute('onclick', 'previewnetimg("' + img.src + '")');
        itemimages.appendChild(img);
    }
 ....
    }
}
```

