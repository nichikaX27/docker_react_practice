import React, { useState } from "react";

const Signup = ({
  onSignupSuccess,
  onToggleMode,
}: {
  onSignupSuccess: () => void;
  onToggleMode: () => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("登録に成功しました！");
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", data.userId);
        onSignupSuccess(); // Call the callback to notify parent component
      } else {
        setMessage(data.error || "登録に失敗しました");
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
            新規登録
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            新しいアカウントを作成して始めましょう
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
                autoComplete="email"
                required
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
                autoComplete="new-password"
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
              登録する
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
              onClick={() => {
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("userId");
                onToggleMode();
              }}
            >
              すでにアカウントをお持ちの方はこちら（ログイン）
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;