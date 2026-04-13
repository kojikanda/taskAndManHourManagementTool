import axios from "axios";

// axiosのインスタンスを作成し、APIのベースURLを設定
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// リクエストインターセプター: 毎回のリクエストにJWTトークンを自動付与する
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
