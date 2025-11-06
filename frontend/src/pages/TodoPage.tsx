import React, { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import styles from "./TodoPage.module.css";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const TodoPage = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await api.get("/api/todos");
        setTodos(response.data);
      } catch (error) {
        console.error("TODOリストの取得に失敗:", error);
      }
    };
    fetchTodos();
  }, [navigate]);

  const handleLogout = () => {
    if (!window.confirm("本当にログアウトしますか？")) return;

    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleCreateTodo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTitle) return;

    try {
      const response = await api.post("/api/todos", { title: newTitle });
      const newTodo = response.data;
      setTodos((currentTodos) => [...currentTodos, newTodo]);
      setNewTitle("");
    } catch (error) {
      console.error("TODOの作成に失敗:", error);
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      const newCompletedStatus = !todo.completed;
      const response = await api.put(`/api/todos/${todo.id}`, {
        title: todo.title,
        completed: newCompletedStatus,
      });
      const updatedTodo = response.data;
      setTodos((currentTodos) =>
        currentTodos.map((t) => (t.id === updatedTodo.id ? updatedTodo : t))
      );
    } catch (error) {
      console.error("更新に失敗:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("本当に削除しますか？")) return;

    try {
      await api.delete(`/api/todos/${id}`, {});
      setTodos((currentTodos) => currentTodos.filter((t) => t.id !== id));
    } catch (error) {
      console.error("削除に失敗", error);
    }
  };

  return (
    <div className={styles.container}>
      <button onClick={handleLogout} className={styles.logoutButton}>
        ログアウト
      </button>
      <h2 className={styles.title}>あなたのTODOリスト</h2>
      <ul className={styles.list}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            onClick={() => handleToggle(todo)}
            className={styles.item}
          >
            <span
              className={`
                ${styles.itemText} 
                ${todo.completed ? styles.itemTextCompleted : ""}
              `}
            >
              {todo.title}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(todo.id);
              }}
              className={styles.deleteButton}
            >
              削除
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreateTodo} className={styles.form}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="新しいTODOを入力"
          className={styles.input}
        />
        <button type="submit" className={styles.addButton}>
          追加
        </button>
      </form>
      {todos.length === 0 && (
        <p className={styles.emptyMessage}>（まだTODOはありません）</p>
      )}
    </div>
  );
};

export default TodoPage;
