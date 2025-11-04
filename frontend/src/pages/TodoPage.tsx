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
  }, []);

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
      {todos.length === 0 && <p>（まだTODOはありません）</p>}
    </div>
  );
};

export default TodoPage;
