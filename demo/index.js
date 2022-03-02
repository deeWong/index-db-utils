import { connectDB, isSupport } from "../src";
/* 判断浏览器是否支持indexDB api */
if (isSupport()) {
    /* 连接demo数据库，不存在时会自动创建 */
    connectDB("demo").then(dbModel => {
        /* 设值 */
        dbModel.set(
            "members",
            [{id: 1, name: 'wdz', age: 18}, {id: 2, name: 'pdk', age: 22}],
            "key"
        ).then(() => {
            /* 取值 */
            dbModel.get("members").then(members => {
                console.log('members list', members);
            })
        });

    });
}