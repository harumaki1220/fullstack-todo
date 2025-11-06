import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import styles from "./LoginPage.module.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/login`, {
        email: email,
        password: password,
      });
      localStorage.setItem("token", response.data.token);
      navigate("/");
    } catch (error) {
      console.error("ログイン失敗:", error);
      alert("メールアドレスまたはパスワードが間違っています");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h2>ログイン</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Eメール:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">パスワード:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.button}>
            ログイン
          </button>
        </form>

        <p className={styles.link}>
          アカウントをお持ちではありませんか？
          <Link to="/register">新規登録</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
