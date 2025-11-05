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

  const handleToggle = async (todo: Todo) => {
    try {
      const token = localStorage.getItem("token");
      const newCompletedStatus = !todo.completed;
      const response = await axios.put(
        `http://localhost:3000/api/todos/${todo.id}`,
        {
          title: todo.title,
          completed: newCompletedStatus,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
      const token = localStorage.getItem("token");

      await axios.delete(`http://localhost:3000/api/todos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodos((currentTodos) => currentTodos.filter((t) => t.id !== id));
    } catch (error) {
      console.error("削除に失敗", error);
    }
  };

  return (
    <div>
      <h2>あなたのTODOリスト</h2>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} onClick={() => handleToggle(todo)}>
            {todo.title}
            {todo.completed ? "(完了)" : "(未完了)"}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(todo.id);
              }}
            >
              削除
            </button>
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
