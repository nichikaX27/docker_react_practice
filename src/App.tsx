import { useState } from "react";
import "./App.css";

function App() {
  const [title, setTitle] = useState("");
  const [todos, setTodos] = useState([
    {
      id: 1,
      title: "Todo 1",
      completed: false,
    },
    {
      id: 2,
      title: "Todo 2",
      completed: false,
    },
    {
      id: 3,
      title: "Todo 3",
      completed: false,
    },
  ]);

  // 追加
  const handleAddTodo = () => {
    setTodos([
      ...todos,
      {
        id: todos.length + 1,
        title: title,
        completed: false,
      },
    ]);
    setTitle("");
  };

  return (
    <>
      <div>
        {todos.map((todo) => (
          <div key={todo.id}>{todo.title}</div>
        ))}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a todo"
        />
        {/* 修正 */}
        <button onClick={handleAddTodo}>Add</button>
        <div>{title}</div>
      </div>
    </>
  );
}

export default App;
