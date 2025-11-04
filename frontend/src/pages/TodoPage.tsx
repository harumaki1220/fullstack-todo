import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get("http://localhost:3000/api/todos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTodos(response.data);
      } catch (error) {
        console.error("TODOリストの取得に失敗:", error);
        //   if (
        //     axios.isAxiosError(error) &&
        //     (error.response?.status === 401 || error.response?.status === 403)
        //   ) {
        //     navigate("/login");
        //   }
      }
    };

    fetchTodos();
  }, [navigate]);

  const handleCreateTodo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTitle) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.post(
        "http://localhost:3000/api/todos",
        { title: newTitle },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const newTodo = response.data;
      setTodos((currentTodos) => [...currentTodos, newTodo]);
      setNewTitle("");
    } catch (error) {
      console.error("TODOの作成に失敗:", error);
    }
  };

  return (
    <div>
      <h2>あなたのTODOリスト</h2>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.title}
            {todo.completed ? "(完了)" : "(未完了)"}
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreateTodo}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="新しいTODOを入力"
        />
        <button type="submit">追加</button>
      </form>
      {todos.length === 0 && <p>（まだTODOはありません）</p>}
    </div>
  );
};

export default TodoPage;
