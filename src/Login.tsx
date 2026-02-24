import React, { useState } from "react";

// onLoginSuccess は App.tsx の setIsSignedUp(true) を呼び出すためのもの
const Login = ({
  onLoginSuccess,
  onToggleMode,
}: {
  onLoginSuccess: () => void;
  onToggleMode: () => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 宛先を /login に変更
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("ログインに成功しました！");
        // ブラウザの倉庫に保存
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", data.userId);

        onLoginSuccess(); // 親コンポーネントの状態を更新
      } else {
        setMessage(data.error || "ログインに失敗しました");
      }
    } catch (error) {
      setMessage("サーバーとの通信に失敗しました");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントにアクセスしてTodoを管理しましょう
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md hover:shadow-lg transition-all duration-200"
            >
              ログイン
            </button>
          </div>
        </form>

        {message && (
          <p
            className={`mt-2 text-center text-sm p-2 rounded ${
              message.includes("成功")
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </p>
        )}

        <div className="flex items-center justify-center">
          <div className="text-sm">
            <button
              type="button"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
              onClick={onToggleMode}
            >
              アカウントをお持ちでない方はこちら（新規登録）
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
