import React, { useState } from "react";
import axios from "axios";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import styles from "./RegisterPage.module.css";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await api.post("/api/register", { email, password });

      alert("登録が成功しました！ログインページに移動します。");
      navigate("/login");
    } catch (error) {
      console.error("登録に失敗:", error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        alert("そのメールアドレスは既に使用されています。");
      } else {
        alert("登録に失敗しました。");
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h2>新規登録</h2>
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
            登録する
          </button>
        </form>
        <p className={styles.link}>
          アカウントを既にお持ちですか？ <Link to="/login">ログイン</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
