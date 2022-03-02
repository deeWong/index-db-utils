const indexedDB =
  window.indexedDB ||
  (window as any).mozIndexedDB ||
  (window as any).webkitIndexedDB ||
  (window as any).msIndexedDB;

/* 是否支持indexDB */
export function isSupport() {
  return !!indexedDB;
}

/**
 *  @desc 打开数据库
 *  @param databaseName 数据库名称{string}
 *  @param version 数据库的版本，默认无须传入{number}
 * */
export function openDB(
  databaseName,
  version = undefined
): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    if (!isSupport()) rej(new Error("当前浏览器不支持indexDB"));
    const request = indexedDB.open(databaseName, version);
    request.onerror = function (event) {
      console.log("数据库报错");
      console.error(event);
    };

    let db: IDBDatabase;

    request.onsuccess = function (event) {
      db = request.result;
      console.log("数据库打开成功");
      res(db);
    };

    request.onupgradeneeded = function (event) {
      db = event.target.result;
      res(db);
    };
  });
}

/**
 *  @desc 连接数据库
 *  @param databaseName 数据库名称{string}
 *  @param version 数据库的版本，默认无须传入{number}
 * */
export async function connectDB(
  databaseName: string,
  version: number = undefined
) {
  const db = await openDB(databaseName, version);
  return createDBModel(db);
}

function createDBModel(db: IDBDatabase) {
  let dbModel = db;
  /**
   * @desc 设值函数
   * @param tableName 表名{string}
   * @param value 设置的值{any[]}
   * @param keyPath 唯一值的path，非必传{any}
   */
  function setObject<T>(
    tableName: string,
    value: T[],
    keyPath: any = undefined
  ): Promise<boolean> {
    return new Promise(async (res, rej) => {
      let objectStore: IDBObjectStore;
      if (!dbModel.objectStoreNames.contains(tableName)) {
        try {
          dbModel.close();
          dbModel = await openDB(dbModel.name, dbModel.version + 1);
          objectStore = dbModel.createObjectStore(tableName, {
            autoIncrement: !keyPath,
            keyPath,
          });
          Object.keys(value[0]).forEach((key) => {
            objectStore.createIndex(key, key, { unique: keyPath === key });
          });
        } catch (err) {
          console.error(err);
        }
      } else {
        objectStore = dbModel
          .transaction(tableName, "readwrite")
          .objectStore(tableName);
      }
      /* 新增 */
      let index = 0;
      let length = value.length;
      const errorList = [];
      const end = () => {
        index++;
        if (index === length) {
          if (errorList.length > 0) console.error("写入失败数据", errorList);
          res(true);
        }
      };
      value.forEach((item) => {
        const request = objectStore.put(item);
        request.onsuccess = function (event) {
          end();
        };
        request.onerror = function (event) {
          errorList.push(item);
          end();
        };
      });
    });
  }

  /**
   * @desc 取值函数
   * @param tableName 表名{string}
   * @param key 如果需要取表中某一条数据，可以传入key值{any}
   */
  function getObject<T>(tableName: string, key: any = undefined): Promise<T[]> {
    return new Promise((res, rej) => {
      if (dbModel.objectStoreNames.contains(tableName)) {
        var objectStore = dbModel.transaction(tableName).objectStore(tableName);
        if (key) {
          var request = objectStore.get(key);
          request.onerror = function (event) {
            rej(new Error("事务失败"));
          };

          request.onsuccess = function (event) {
            if (request.result) {
              res([request.result]);
            } else {
              res(undefined);
            }
          };
        } else {
          const obj = [];
          objectStore.openCursor().onsuccess = function (event: any) {
            const cursor: IDBCursorWithValue = event.target.result;
            if (cursor) {
              obj.push(cursor.value);
              cursor.continue();
            } else {
              console.log("没有更多数据了！");
              res(obj);
            }
          };
        }
      } else {
        res(null);
      }
    });
  }

  return {
    get: getObject,
    set: setObject,
    db,
  };
}
