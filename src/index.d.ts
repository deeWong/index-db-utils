// Type definitions for ./src/index.js
// Project: [LIBRARY_URL_HERE]
// Definitions by: [YOUR_NAME_HERE] <[YOUR_URL_HERE]>
// Definitions: https://github.com/borisyankov/DefinitelyTyped
// connectDB.!ret

/**
 *
 */
declare interface Ret {
  /**
   * @desc 取值函数
   * @param tableName 表名{string}
   * @param key 如果需要取表中某一条数据，可以传入key值{any}
   * @return Promise<T[]>
   */
  get<T>(tableName: string, key?: any): Promise<T[]>;

  /**
   * @desc 设值函数
   * @param tableName 表名{string}
   * @param value 设置的值{any[]}
   * @param keyPath 唯一值的path，非必传{any}
   * @return Promise<boolean>
   */
  set<T>(tableName: string, value: any[], keyPath?: any): Promise<boolean>;
  db: IDBDatabase;
}

/**
 * @desc 是否支持indexDB
 * @return boolean
 */
export declare function isSupport(): boolean;

/**
 * @desc 打开数据库
 * @param databaseName 数据库名称{string}
 * @param version 数据库的版本，默认无须传入{number}
 * @return Promise<IDBDatabase>
 */
declare function openDB(
  databaseName: string,
  version?: number
): Promise<IDBDatabase>;

/**
 * @desc 连接数据库
 * @param databaseName 数据库名称{string}
 * @param version 数据库的版本，默认无须传入{number}
 * @return
 */
export declare function connectDB(databaseName: string, version?: number): Ret;

/**
 * @desc 生成一个DBModel
 * @param db 数据库实例
 * @return Ret
 */
declare function createDBModel(db: IDBDatabase): Ret;
