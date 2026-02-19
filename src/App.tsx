import { useEffect, useState } from "react";
import Signup from "./Signup";
import Login from "./Login";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:3000"
    : "https://docker-react-practice.onrender.com");

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [isSignedUp, setIsSignedUp] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    if(isSignedUp) {
    fetchTodos();
    }
  }, [isSignedUp]);

  const withAuth = (action: (UserId: string, ...args:any[]) => Promise<void>) => {
    return async (...args: any[]) => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("ユーザーIDが見つかりません。ログインしてください。");
        return;
      }
      await action(userId, ...args);
    };
  };


  const fetchTodos = withAuth(async (userId) => {
    const response = await fetch(`${API_URL}/todos?userId=${userId}`);
    const data = await response.json();
    setTodos(data.todos);
  });

  const handleAddTodo = withAuth(async (userId) => {
    if (title.trim()) {
      try {
        const response = await fetch(`${API_URL}/todos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, userId }), // ユーザーIDも送信
        });
        if (response.ok) {
          setTitle("");
          fetchTodos(); // タスクを再取得して表示を更新
        }
      } catch (error) {
        console.error("Error adding todo:", error);
      }
    }
  });

  const handleToggleTodo = withAuth(async (userId, id, completed) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: !completed , userId: userId}), // ユーザーIDも送信
      });
      if (response.ok) {
        fetchTodos(); // タスクを再取得して表示を更新
      }
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  });

  const handleDeleteTodo = withAuth(async(userId, id) => {
    if (!confirm("本当にこのタスクを削除しますか？")) return;
    try {
      const response = await fetch(`${API_URL}/todos/${id}?userId=${userId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchTodos(); // タスクを再取得して表示を更新
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  });

  const handleclearCompleted = withAuth(async (userId) => {
    if (!confirm("完了したタスクをすべて削除しますか？")) return;
    try {
      const response = await fetch(`${API_URL}/todos/completed/all?userId=${userId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchTodos(); // タスクを再取得して表示を更新
      } else {
        alert("完了したタスクの一括削除に失敗しました。");
      }
    } catch (error) {
      console.error("Error deleting completed todos:", error);
    }
  });

  // ログアウト処理
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userId");
    setIsSignedUp(false);
  };

  if (!isSignedUp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        {/* フォーム本体 */}
        <div className="w-full max-w-md">
          {authMode === "login" ? (
            <Login onLoginSuccess={() => setIsSignedUp(true)} onToggleMode={() => setAuthMode("signup")} />
          ) : (
            <Signup onSignupSuccess={() => setIsSignedUp(true)} onToggleMode={() => setAuthMode("login")} />
          )}

          {/* 切り替えボタンをフォームのすぐ下に配置 */}
          <div className="text-center mt-6">
            <button
              onClick={() =>
                setAuthMode(authMode === "login" ? "signup" : "login")
              }
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium bg-white/50 px-4 py-2 rounded-full shadow-sm transition-all"
            >
              {authMode === "login"
                ? "アカウント作成はこちら（新規登録）"
                : "既にアカウントをお持ちの方はこちら（ログイン）"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
              📝 Todoアプリ
            </h1>
            <button
              onClick={handleLogout}
              className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2 py-1 rounded"
            >
              ログアウト
            </button>
          </div>

          <div className="App">
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="新しいタスクを入力..."
                aria-label="新しいタスクを入力"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
              <button
                onClick={handleAddTodo}
                disabled={!title.trim()}
                className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${
                  !title.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-100"
                }`}
              >
                追加
              </button>
            </div>
          </div>

          {todos.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg">タスクがありません</p>
              <p className="text-sm">新しいタスクを追加してください</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all accent-blue-500 duration-300 ease-in-out hover:shadow-md hover:-translate-y-0.5 ${
                    todo.completed
                      ? "bg-gray-50 border-gray-200"
                      : "bg-white border-gray-300 hover:border-blue-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleTodo(todo.id, todo.completed)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span
                    className={`flex-1 ${
                      todo.completed
                        ? "line-through text-gray-500"
                        : "text-gray-800"
                    }`}
                  >
                    {todo.title}
                  </span>

                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    aria-label="削除"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}

          {todos.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                完了済み: {todos.filter((todo) => todo.completed).length} /{" "}
                {todos.length}
              </p>
            </div>
          )}
          <button
            onClick={handleclearCompleted}
            className="mt-4 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
          >
            完了したタスクを一括削除
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
