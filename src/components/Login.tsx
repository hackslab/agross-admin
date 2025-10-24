import React, { useState } from "react";
import { loginAdmin, ApiError } from "../services/api";

interface LoginProps {
  onLogin: (username: string, isSuperadmin: boolean, userId: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Iltimos foydalanuvchi nomi va parolni kiriting");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Call backend API to authenticate
      const response = await loginAdmin({ username, password });

      // Login successful - pass user data to parent
      onLogin(
        response.admin.username,
        response.admin.isSuperadmin,
        response.admin.id
      );
    } catch (err) {
      // Handle API errors
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Noto'g'ri foydalanuvchi nomi yoki parol");
        } else if (err.status === 408) {
          setError("So'rov vaqti tugadi. Qaytadan urinib ko'ring");
        } else if (err.status === 0) {
          setError("Serverga ulanib bo'lmadi. Tarmoq ulanishini tekshiring");
        } else {
          setError(err.message || "Xatolik yuz berdi");
        }
      } else {
        setError("Noma'lum xatolik yuz berdi");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-[#f5f7fa] to-[#e8f0f0] p-4">
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] p-12 w-full max-w-[420px]">
        <div className="text-center mb-8">
          <h1 className="m-0 mb-2 text-3xl text-gray-800 font-bold">
            Agross Admin
          </h1>
          <p className="m-0 text-gray-600 text-[0.95rem]">
            Hisobingizga kiring
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm text-center border border-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="username"
              className="text-gray-800 font-medium text-[0.95rem]"
            >
              Foydalanuvchi nomi
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Foydalanuvchi nomini kiriting"
              className="px-4 py-3.5 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-all duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-gray-800 font-medium text-[0.95rem]"
            >
              Parol
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parolni kiriting"
              className="px-4 py-3.5 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-all duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            className="bg-teal-700 text-white px-6 py-3.5 rounded-lg border-none cursor-pointer font-semibold text-base transition-all duration-200 mt-2 hover:bg-teal-800 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(4,94,82,0.3)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Yuklanmoqda..." : "Kirish"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
