import { isObject } from "./utils";
const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB;

export function isSupport() {
  return !!indexedDB;
}

function openDB(databaseName, version = undefined) {
  return new Promise((res, rej) => {
    if (!isSupport()) rej(new Error("当前浏览器不支持indexDB"));
    const request = indexedDB.open(databaseName, version);
    request.onerror = function (event) {
      console.log("onerror");
      console.error(event);
    };

    let db;

    request.onsuccess = function (event) {
      db = request.result;
      console.log("onsuccess");
      res(db);
    };

    request.onupgradeneeded = function (event) {
      db = event.target.result;
      console.log("onupgradeneeded");
      res(db);
    };
  });
}

export async function connectDB(databaseName, version) {
  const db = await openDB(databaseName, version);
  return createDBModel(db);
}

function createDBModel(db) {
  let dbModel = db;

  function setObject(...arg) {
    let tableName, value, keyPath;
    if (isObject(arg[0])) {
      tableName = arg[0].tableName;
      keyPath = arg[0].keyPath;
      const passType = arg[0].passType || "array";
      if (passType === "array") value = arg[0].value;
      else value = Object.values(arg[0].value);
    } else {
      tableName = arg[0];
      value = arg[1];
      keyPath = arg[2];
    }
    return new Promise(async (res, rej) => {
      let objectStore;
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

      objectStore.transaction.oncomplete = () => {
        console.log("set transaction complete");
        res(true);
      };

      /* 新增 */
      runFunctions(
        value,
        (item) => objectStore.put(item),
        (errorList) => console.error("写入失败数据", errorList)
      );
    });
  }

  function getObject(...arg) {
    return new Promise((res, rej) => {
      let tableName, key, returnType;
      if (isObject(arg[0])) {
        tableName = arg[0].tableName;
        key = arg[0].key;
        returnType = arg[0].returnType || "array";
      } else {
        tableName = arg[0];
        key = arg[1];
        returnType = "array";
      }
      if (dbModel.objectStoreNames.contains(tableName)) {
        var objectStore = dbModel.transaction(tableName).objectStore(tableName);
        let result;
        if (key) {
          var request = objectStore.get(key);
          request.onerror = function (event) {
            rej(new Error("事务失败"));
          };
          request.onsuccess = function (event) {
            if (request.result)
              result =
                returnType === "array"
                  ? [request.result]
                  : { [key]: request.result };
          };
        } else {
          var request = objectStore.getAll();
          request.onerror = function (event) {
            rej(new Error("事务失败"));
          };
          request.onsuccess = function (event) {
            if (request.result) {
              if (returnType === "array") {
                result = request.result;
              } else {
                result = {};
                request.result.forEach((item) => {
                  result[item[objectStore.keyPath]] = item;
                });
              }
            }
          };
        }
        objectStore.transaction.oncomplete = () => {
          console.log("get transaction complete");
          res(result);
        };
      } else {
        res(null);
      }
    });
  }

  function requestToPromise(request) {
    return new Promise((res, rej) => {
      request.onsuccess = function (event) {
        res(event);
      };
      request.onerror = function (event) {
        rej(event);
      };
    });
  }

  /* 执行多任务 */
  function runFunctions(list, callback, errorMsg) {
    let index = 0;
    let length = list.length;
    const errorList = [];
    const end = () => {
      index++;
      if (index === length) {
        if (errorList.length > 0)
          console.error(
            errorMsg ? errorMsg(errorList) : "写入失败数据",
            errorList
          );
      }
    };

    list.forEach((item) => {
      requestToPromise(callback(item))
        .then(end)
        .catch(() => {
          errorList.push(item);
          end();
        });
    });
  }

  function clear(tableName, keys) {
    return new Promise((res, rej) => {
      if (!dbModel.objectStoreNames.contains(tableName)) {
        rej(new Error("table is not exist"));
        return;
      }
      const objectStore = dbModel
        .transaction(tableName, "readwrite")
        .objectStore(tableName);
      objectStore.transaction.oncomplete = () => {
        console.log("clear transaction complete");
        res(true);
      };
      if (keys?.length > 0) {
        runFunctions(
          keys,
          (key) => objectStore.delete(key),
          (errorList) => {
            console.error("删除数据失败", errorList);
          }
        );
      } else {
        requestToPromise(objectStore.clear())
          .then(() => {
            res(true);
          })
          .catch((err) => {
            rej(new Error("删除数据失败"), err);
          });
      }
    });
  }

  return {
    get: getObject,
    set: setObject,
    clear,
    db: dbModel,
  };
}
