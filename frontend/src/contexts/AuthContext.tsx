"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { LoginResponse } from "@/types";

/**
 * コンテキストで管理するユーザ情報の型。
 * ローカルストレージから読み込んだ認証済みユーザ情報を保持。
 */
type AuthUser = {
  userId: number;
  name: string;
  email: string;
};

/**
 * コンテキストが提供するユーザ認証関連情報の型
 */
type AuthContextType = {
  user: AuthUser | null;
  login: (data: LoginResponse) => void;
  logout: () => void;
};

/**
 * ユーザ認証関連情報コンテキスト。
 * ログイン情報はアプリ全体で必要となるため、コンテキストで保持する。
 */
const AuthContext = createContext<AuthContextType | null>(null);

// localStorage からユーザ情報を読み込むメソッド(useState の初期値として使用)
function loadUserFromStorage(): AuthUser | null {
  // SSR時は window が存在しないため null を返す
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const name = localStorage.getItem("name");
  const email = localStorage.getItem("email");

  if (token && userId && name && email) {
    return { userId: Number(userId), name, email };
  }
  return null;
}

/**
 * ユーザ認証関連情報取得用コンポーネント取得メソッド。
 * ユーザ認証関連情報をコンテキスト経由で取得するためのコンポーネントを返却する。
 * @param children 子コンポーネント
 * @returns ユーザ認証関連情報取得用コンポーネント
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // 遅延初期化: 初回レンダリング時に一度だけ loadUserFromStorage() を呼ぶ
  // useState(メソッド)で、遅延初期化となり、初回レンダリング時に一度だけ実行される
  const [user, setUser] = useState<AuthUser | null>(loadUserFromStorage);

  // ログインレスポンスの情報をローカルストレージに設定するメソッド
  const login = (data: LoginResponse) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", String(data.userId));
    localStorage.setItem("name", data.name);
    localStorage.setItem("email", data.email);
    setUser({ userId: data.userId, name: data.name, email: data.email });
  };

  // ログインの情報をローカルストレージから削除し、ログアウトするメソッド
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * ユーザ認証関連情報のuseContextフック取得メソッド
 * @returns ユーザ認証関連情報
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth は AuthProvider の内側で使用してください");
  }
  return context;
}
