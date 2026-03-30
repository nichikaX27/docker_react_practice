import { useEffect, useState } from "react";
import Signup from "./Signup";
import Login from "./Login";

interface Todolist {
  id: number;
  name: string;
  _count: {
    todos: number;
  };
}

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

// App.tsx
// 環境変数があればそれ、なければ localhost（ローカル開発用）
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
});

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [lists, setLists] = useState<Todolist[]>([]);
  const [currentListId, setCurrentListId] = useState<number | null>(null);
  const [newListLabel, setNewListLabel] = useState("");

  const [title, setTitle] = useState("");
  const [isSignedUp, setIsSignedUp] = useState(() => {
    return !!localStorage.getItem("token");
  });
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    if (isSignedUp) {
      fetchLists();
    }
  }, [isSignedUp]);

  useEffect(() => {
    if (currentListId !== null) {
      fetchTodos();
    }
  }, [currentListId]);

  const withAuth = (
    action: (...args: any[]) => Promise<void>,
  ) => {
    return async (...args: any[]) => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("ログインしてください。");
        setIsSignedUp(false);
        return;
      }
      await action(...args);
    };
  };

  const fetchLists = withAuth(async () => {
    // ユーザー切り替え時に前のユーザーのデータを即クリア
    setTodos([]);
    setLists([]);
    setCurrentListId(null);
    const response = await fetch(`${API_URL}/lists`, { headers: getAuthHeaders() });
    const data = await response.json();
    setLists(data.list);
    if (data.list.length > 0) {
      setCurrentListId(data.list[0].id); // 最初のリストを選択
    }
  });

  const fetchTodos = withAuth(async (listId?: number) => {
    const targetId = listId || currentListId;
    if (!targetId) return;
    const response = await fetch(
      `${API_URL}/todos?listId=${targetId}`,
      { headers: getAuthHeaders() },
    );
    const data = await response.json();
    setTodos(data.todos);
  });

  const handleAddList = withAuth(async () => {
    if (!newListLabel.trim()) return;
    try {
      const response = await fetch(`${API_URL}/lists`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newListLabel }),
      });
      if (response.ok) {
        const newList = await response.json();
        setLists((prev) => [...prev, newList]);
        setCurrentListId(newList.id); // 新規作成したリストを自動選択
        setNewListLabel("");
      }
    } catch (error) {
      console.error("Error adding list:", error);
    }
  });

  const handleDeleteList = withAuth(async (id) => {
    if (!confirm("本当にこのリストを削除しますか？")) return;
    try {
      const response = await fetch(`${API_URL}/lists/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setLists((prev) => prev.filter((list) => list.id !== id));
        if (currentListId === id) {
          setCurrentListId(null); // 削除したリストが現在選択されている場合、選択を解除
        }
      } else {
        alert("リストの削除に失敗しました。");
      }
    } catch (error) {
      console.error("Error deleting list:", error);
    }
  });

  const handleAddTodo = withAuth(async () => {
    if (!title.trim()) {
      alert("タイトルを入力してください。");
      return;
    }
    if (!currentListId) {
      alert("リストを選択してください。");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: title.trim(), listId: currentListId }),
      });
      if (response.ok) {
        setTitle(""); // 入力欄をクリア
        fetchTodos(currentListId); // タスクを再取得して表示を更新
      } else {
        const data = await response.json();
        alert(data.error || "TODOの追加に失敗しました。");
      }
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  });

  const handleToggleTodo = withAuth(async (id, completed) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}?listId=${currentListId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ completed: !completed }),
      });
      if (response.ok) {
        fetchTodos(currentListId); // タスクを再取得して表示を更新
      }
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  });

  const handleDeleteTodo = withAuth(async (id) => {
    if (!confirm("本当にこのタスクを削除しますか？")) return;
    try {
      const response = await fetch(`${API_URL}/todos/${id}?listId=${currentListId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        fetchTodos(currentListId); // タスクを再取得して表示を更新
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  });

  const handleclearCompleted = withAuth(async () => {
    if (!confirm("完了したタスクをすべて削除しますか？")) return;
    try {
      const response = await fetch(
        `${API_URL}/todos/completed/all?listId=${currentListId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      if (response.ok) {
        fetchTodos(currentListId); // タスクを再取得して表示を更新
      } else {
        alert("完了したタスクの一括削除に失敗しました。");
      }
    } catch (error) {
      console.error("Error deleting completed todos:", error);
    }
  });

  // ログアウト処理
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setIsSignedUp(false);
    setCurrentListId(null);
    setTodos([]);
    setLists([]);
    setTitle("");
  };

  if (!isSignedUp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        {/* フォーム本体 */}
        <div className="w-full max-w-md">
          {authMode === "login" ? (
            <Login
              onLoginSuccess={() => setIsSignedUp(true)}
              onToggleMode={() => setAuthMode("signup")}
            />
          ) : (
            <Signup
              onSignupSuccess={() => setIsSignedUp(true)}
              onToggleMode={() => setAuthMode("login")}
            />
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

  const handleUpdateTitle = withAuth(async (id, title) => {
    if (!title.trim()) return;
    try {
      const response = await fetch(`${API_URL}/todos/${id}?listId=${currentListId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!response.ok) {
        console.error("Title update failed");
      }
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col md:flex-row p-4 md:p-8 gap-4 md:gap-6">
      {/* 📂 左側：サイドバー (リスト一覧) - 30% */}
      <div className="w-full md:w-[30%] bg-slate-800 text-white rounded-xl shadow-lg flex flex-col overflow-hidden">
        <div className="p-6 bg-slate-900">
          <h2 className="text-xl font-bold flex items-center gap-2">📂 リスト一覧</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {lists.map((list) => (
            <div
              key={list.id}
              onClick={() => setCurrentListId(list.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all flex justify-between items-center group cursor-pointer ${
                currentListId === list.id 
                  ? "bg-blue-600 shadow-md transform scale-[1.02]" 
                  : "hover:bg-slate-700 hover:pl-5"
              }`}
            >
              <span className="truncate font-medium">{list.name}</span>
              <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteList(list.id);
              }}
              className="ml-2 text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">削除</button>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                currentListId === list.id ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-400 group-hover:bg-slate-600"
              }`}>
                {list._count?.todos || 0}
              </span>
            </div>
          ))}
        </div>

        {/* リスト追加フォーム (サイドバー下部) */}
        <div className="p-4 bg-slate-900 border-t border-slate-700">
          <div className="flex gap-2 shrink-0">
            <input
              type="text"
              value={newListLabel}
              onChange={(e) => setNewListLabel(e.target.value)}
              placeholder="新しいリスト..."
              className="flex-1 bg-slate-800 border-slate-700 text-white text-sm rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleAddList()}
            />
            <button
              onClick={handleAddList}
              className="flex-none flex items-center justify-center w-10 h-10 bg-blue-600 text-white text-2xl font-bold rounded hover:bg-blue-700 transition-colors shrink-0"
              aria-label="リストを追加"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* 📝 右側：メインコンテンツ (Todoタスク) - 70% */}
      <div className="w-full md:w-[70%] bg-white rounded-xl shadow-lg flex flex-col overflow-hidden">
        <div className="p-4 md:p-8 h-full overflow-y-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                {lists.find(l => l.id === currentListId)?.name || "Todoアプリ"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                ログイン中: <span className="font-medium text-blue-600">{localStorage.getItem("email") || "ユーザー"}</span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 px-4 py-2 rounded-lg transition-colors"
            >
              ログアウト
            </button>
          </div>

          <div className="mb-8">
            <div className="flex gap-3">
              <input
                 type="text"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                 placeholder="新しいタスクを入力..."
                 className="flex-1 px-4 py-3 bg-slate-50 text-black border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
               />
              <button
                onClick={handleAddTodo}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 "
              >
                追加
              </button>
            </div>
          </div>

          {todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <span className="text-6xl mb-4">📝</span>
              <p className="text-lg font-medium">タスクがありません</p>
              <p className="text-sm">新しいタスクを追加して始めましょう</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 group ${
                    todo.completed
                      ? "bg-slate-50 border-slate-100"
                      : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md"
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo.id, todo.completed)}
                      className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-md checked:bg-blue-500 checked:border-blue-500 transition-colors cursor-pointer"
                    />
                    <svg className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  <input
                    type="text"
                    value={todo.title}
                    onChange={(e) => {
                      const newTodos = todos.map((t) =>
                        t.id === todo.id ? { ...t, title: e.target.value } : t,
                      );
                      setTodos(newTodos);
                    }}
                    onBlur={(e) => handleUpdateTitle(todo.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                    className={`flex-1 bg-transparent focus:outline-none text-lg transition-colors ${
                      todo.completed ? "text-slate-400 line-through" : "text-slate-700"
                    }`}
                  />

                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="削除"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}

          {todos.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
              <p className="text-sm text-slate-500">
                <span className="font-medium text-slate-700">{todos.filter(t => t.completed).length}</span> / {todos.length} 完了
              </p>
              
              <button
                onClick={handleclearCompleted}
                className="text-sm text-red-500 hover:text-red-700 hover:underline px-2 py-1 rounded transition-colors"
               >
                完了済みのタスクをすべて削除
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
