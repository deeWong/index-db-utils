# indexDB

## 说明
indexDB 语法糖，更加方便使用 indexDB 做本地存储

## 安装
```
npm install index-db-utils
```

## 使用方式
```
import { connectDB, isSupport } from "index-db-utils";
if (isSupport()) {
    connectDB("demo").then(dbModel => {
        dbModel.set(
            "members",
            [{id: 1, name: 'wdz', age: 18}, {id: 2, name: 'pdk', age: 22}],
            "key"
        ).then(() => {
            dbModel.get("members").then(members => {
                console.log('members list', members);
            })
        });

    });
}
```

## Demo
详询 [Demo](https://github.com/deeWong/indexDB/tree/master/demo)
