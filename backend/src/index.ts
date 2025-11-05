import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

import * as dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env file");
}

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://harumaki1220.github.io"],
  })
);

app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

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

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user || !(await compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful", token: token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

interface AuthRequest extends Request {
  user?: { userId: number; email: string };
}

const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.user = user;
    next();
  });
};

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
          authorId: userId,
        },
      });

      res.status(201).json(newTodo);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.put(
  "/api/todos/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { title, completed } = req.body;
      const userId = req.user?.userId;

      if (!id) {
        return res.status(400).json({ message: "Todo ID is required" });
      }
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const numericId = parseInt(id);

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

      const updatedTodo = await prisma.todo.update({
        where: {
          id: numericId,
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

      const numericId = parseInt(id);

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

      await prisma.todo.delete({
        where: {
          id: numericId,
        },
      });

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
