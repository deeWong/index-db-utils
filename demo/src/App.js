import "./App.css";
import { connectDB, isSupport } from "index-db-utils";
import { useEffect, useRef, useState } from "react";
const dbName = "demo";
const tableName = "members";
function App() {
  const [list, setList] = useState([]);
  const dbRef = useRef(null);
  const getList = () => {
    dbRef.current?.get(tableName).then((data) => setList(data || []));
  };
  const setValue = (list) => {
    dbRef.current?.set(tableName, list, "id").then(getList);
  };
  useEffect(() => {
    if(!isSupport()) {
      alert('当前浏览器不支持indexDB api, 详见https://caniuse.com/?search=indexDB');
      return;
    }
    connectDB(dbName).then((dbModel) => {
      dbRef.current = dbModel;
      getList();
    });
  }, []);
  return (
    <div className="App">
      <button
        onClick={() => {
          if (dbRef.current) {
            const value = list.length + 1;
            setValue([{ id: value, name: `数字${value}`, age: value + 10 }]);
          }
        }}
      >
        增加一条数据
      </button>
      {list?.length > 0 && (
        <table className="list">
          <tr>
            <td>序号</td>
            <td>姓名</td>
            <td>年龄</td>
            <td>操作</td>
          </tr>
          {list.map((item) => (
            <tr>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.age}</td>
              <td>
                <a
                  onClick={() => {
                    setValue([{ ...item, age: item.age + 1 }]);
                  }}
                >
                  +1
                </a>
              </td>
            </tr>
          ))}
        </table>
      )}
    </div>
  );
}

export default App;
