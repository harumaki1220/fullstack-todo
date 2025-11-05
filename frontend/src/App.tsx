import { HashRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TodoPage from "./pages/TodoPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<TodoPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
