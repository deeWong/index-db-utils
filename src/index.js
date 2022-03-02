const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB;

export function isSupport() {
  return !!indexedDB;
}

function openDB(
  databaseName,
  version = undefined
) {
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
  function setObject(
    tableName,
    value,
    keyPath = undefined
  ) {
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
        console.log('set transaction complete');
        res(true);
      }

      /* 新增 */
      let index = 0;
      let length = value.length;
      const errorList = [];
      const end = () => {
        index++;
        if (index === length) {
          if (errorList.length > 0) console.error("写入失败数据", errorList);
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

  function getObject(tableName, key = undefined) {
    return new Promise((res, rej) => {
      if (dbModel.objectStoreNames.contains(tableName)) {
        var objectStore = dbModel.transaction(tableName).objectStore(tableName);
        let result;
        if (key) {
          var request = objectStore.get(key);
          request.onerror = function (event) {
            rej(new Error("事务失败"));
          };
          request.onsuccess = function (event) {
            if (request.result) result = [request.result];
          };
        } else {
          result = [];
          objectStore.openCursor().onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
              result.push(cursor.value);
              cursor.continue();
            }
          };
        }
        objectStore.transaction.oncomplete = () => {
          console.log('get transaction complete');
          res(result);
        }
      } else {
        res(null);
      }
    });
  }

  return {
    get: getObject,
    set: setObject,
    db: dbModel,
  };
}
