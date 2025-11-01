import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { hash, compare } from "bcrypt"; // ← 先頭に移動
import jwt from "jsonwebtoken"; // ← 先頭に移動

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

// --- APIエンドポイント ---

app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!" });
});

// 1. ユーザー登録
app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // ▼▼▼ "login" の定義はここから削除する ▼▼▼
    // app.post("/api/login", ...);
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Email already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 2. ユーザーログイン (★register と同じ階層に、独立して定義する★)
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user || !(await compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const JWT_SECRET = "your-super-secret-key";
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful", token: token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

import { Request, Response, NextFunction } from "express";

// ExpressのRequest型を拡張して、userプロパティを持てるようにする
interface AuthRequest extends Request {
  user?: { userId: number; email: string };
}

const JWT_SECRET = "your-super-secret-key"; // login時と必ず同じ文字列にする

// ▼ 認証ミドルウェア（門番） ▼
const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // 1. リクエストヘッダーから "Authorization" を取得
  const authHeader = req.headers["authorization"];
  // 'Bearer [TOKEN]' という形式なので、[TOKEN]部分だけ取り出す
  const token = authHeader && authHeader.split(" ")[1];

  // 2. トークンが無い場合はエラー
  if (token == null) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  // 3. トークンを検証
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      // 有効期限切れや不正なトークン
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    // 4. 検証成功：リクエスト (req) にユーザー情報を添付して、次の処理（API本体）に通す
    req.user = user;
    next();
  });
};

// 1. 自分のTODOをすべて取得 (GET /api/todos)
//    ★authenticateToken を挟むことで、認証済みユーザーのみアクセス可能になる
app.get(
  "/api/todos",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const todos = await prisma.todo.findMany({
        where: {
          authorId: userId,
        },
        orderBy: {
          id: "asc",
        },
      });

      res.json(todos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// 2. 新しいTODOを作成 (POST /api/todos)
app.post(
  "/api/todos",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { title } = req.body;
      const userId = req.user?.userId;

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const newTodo = await prisma.todo.create({
        data: {
          title: title,
          authorId: userId, // 認証済みユーザーのIDを紐付ける
        },
      });

      res.status(201).json(newTodo);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// 3. TODOを更新 (PUT /api/todos/:id)
app.put(
  "/api/todos/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params; // id は string | undefined
      const { title, completed } = req.body;
      const userId = req.user?.userId;

      if (!id) {
        return res.status(400).json({ message: "Todo ID is required" });
      }
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const numericId = parseInt(id); // idがstringだと確定したのでOK

      // 更新するTODOが、本当に自分のものかを確認
      const todoToUpdate = await prisma.todo.findFirst({
        where: {
          id: numericId,
          authorId: userId,
        },
      });

      if (!todoToUpdate) {
        return res
          .status(404)
          .json({ message: "Todo not found or unauthorized" });
      }

      // 自分のTODOだったので、更新を許可
      const updatedTodo = await prisma.todo.update({
        where: {
          id: numericId, // OK
        },
        data: {
          title: title,
          completed: completed,
        },
      });

      res.json(updatedTodo);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// 4. TODOを削除 (DELETE /api/todos/:id)
app.delete(
  "/api/todos/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        return res.status(400).json({ message: "Todo ID is required" });
      }
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const numericId = parseInt(id); // idがstringだと確定したのでOK

      // 削除するTODOが、本当に自分のものかを確認
      const todoToDelete = await prisma.todo.findFirst({
        where: {
          id: numericId,
          authorId: userId,
        },
      });

      if (!todoToDelete) {
        return res
          .status(404)
          .json({ message: "Todo not found or unauthorized" });
      }

      // 自分のTODOだったので、削除を許可
      await prisma.todo.delete({
        where: {
          id: numericId,
        },
      });

      res.status(204).send(); // 成功 (コンテンツ無し)
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
