import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt, sign } from "hono/jwt";
import { PrismaClient } from "@prisma/client";
import { hash, compare } from "bcryptjs";

const app = new Hono();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

// CORSを許可
app.use(cors({ origin: "*" }));

// JWT認証ミドルウェア（/signup, /login, / は除外）
app.use("*", async (c, next) => {
  const path = c.req.path;
  if (path === "/" || path === "/signup" || path === "/login") {
    return next();
  }
  return jwt({ secret: JWT_SECRET })(c, next);
});

// ルートエンドポイント
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// TODOリスト取得エンドポイント（ユーザーIDでフィルタリング）
app.get("/lists", async (c) => {
  const { userId } = c.get("jwtPayload") as { userId: number };
  const list = await prisma.todoList.findMany({
    where: { userId: Number(userId) },
    include: { _count: { select: { todos: true } } },
  });
  return c.json({ list });
});

// TODOリスト作成エンドポイント
app.post("/lists", async (c) => {
  try {
    const { userId } = c.get("jwtPayload") as { userId: number };
    const { name } = await c.req.json();
    if (!name || !name.trim()) {
      return c.json({ error: "リスト名は必須です" }, 400);
    }
    const newList = await prisma.todoList.create({
      data: { name: name.trim(), userId: Number(userId) },
    });
    return c.json(newList);
  } catch (error) {
    return c.json({ error: "リストの作成に失敗しました" }, 500);
  }
});

// TODOリスト取得エンドポイント
app.get("/todos", async (c) => {
  const { userId } = c.get("jwtPayload") as { userId: number };
  const listId = Number(c.req.query("listId"));

  const list = await prisma.todoList.findFirst({
    where: { id: listId, userId: Number(userId) },
  });
  if (!list) {
    return c.json({ todos: [] });
  }

  const todos = await prisma.todo.findMany({
    where: { listId },
    orderBy: { id: "asc" },
  });
  return c.json({ todos });
});

// TODO作成エンドポイント
app.post("/todos", async (c) => {
  try {
    const { userId } = c.get("jwtPayload") as { userId: number };
    const { title, listId } = await c.req.json();
    if (!title || !title.trim()) {
      return c.json({ error: "タイトルは必須です" }, 400);
    }
    if (!listId) {
      return c.json({ error: "リストIDは必須です" }, 400);
    }
    // listIdがこのユーザーのものか確認
    const list = await prisma.todoList.findFirst({
      where: { id: Number(listId), userId: Number(userId) },
    });
    if (!list) {
      return c.json({ error: "リストが見つからないか権限がありません" }, 404);
    }
    const newTodo = await prisma.todo.create({
      data: { title: title.trim(), completed: false, listId: Number(listId) },
    });
    return c.json(newTodo);
  } catch (error) {
    console.error("Prisma error:", error);
    return c.json({ error: "TODOの作成に失敗しました", detail: String(error) }, 500);
  }
});

//Todolist削除エンドポイント
app.delete("/lists/:id", async (c) => {
  const { userId } = c.get("jwtPayload") as { userId: number };
  const id = Number(c.req.param("id"));
  try {
    const list = await prisma.todoList.findFirst({
      where: { id, userId: Number(userId) },
    });
    if (!list) {
      return c.json({ message: "リストが見つからないか権限がありません" }, 404);
    }
    await prisma.todoList.delete({ where: { id } });
    return c.json({ message: "Todo list deleted successfully" });
  } catch (error) {
    return c.json({ message: "Error deleting todo list", error }, 500);
  }
});

// 完了したTODO一括削除エンドポイント
app.delete("/todos/completed/all", async (c) => {
  try {
    const { userId } = c.get("jwtPayload") as { userId: number };
    const listId = Number(c.req.query("listId"));
    const list = await prisma.todoList.findFirst({
      where: { id: listId, userId: Number(userId) },
    });
    if (!list) {
      return c.json({ error: "権限がありません" }, 403);
    }
    const result = await prisma.todo.deleteMany({
      where: { listId, completed: true },
    });
    return c.json({
      message: `${result.count} 件の完了したTodoを削除しました。`,
    });
  } catch (error) {
    return c.json({ error: "一括削除に失敗しました" }, 500);
  }
});

// TODO更新エンドポイント
app.put("/todos/:id", async (c) => {
  const { userId } = c.get("jwtPayload") as { userId: number };
  const id = Number(c.req.param("id"));
  const listId = Number(c.req.query("listId"));
  const { title, completed } = await c.req.json();

  const list = await prisma.todoList.findFirst({
    where: { id: listId, userId: Number(userId) },
  });
  if (!list) {
    return c.json({ error: "権限がありません" }, 403);
  }

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (completed !== undefined) updateData.completed = completed;

  if (Object.keys(updateData).length === 0) {
    return c.json({ message: "更新するデータがありません" }, 400);
  }

  try {
    const updatedTodo = await prisma.todo.updateMany({
      where: { id, listId },
      data: updateData,
    });
    return c.json(updatedTodo);
  } catch (error) {
    console.error("Prisma error:", error);
    return c.json({ message: "Error updating todo", error }, 500);
  }
});

// TODO削除エンドポイント
app.delete("/todos/:id", async (c) => {
  const { userId } = c.get("jwtPayload") as { userId: number };
  const id = Number(c.req.param("id"));
  const listId = Number(c.req.query("listId"));
  const list = await prisma.todoList.findFirst({
    where: { id: listId, userId: Number(userId) },
  });
  if (!list) {
    return c.json({ error: "権限がありません" }, 403);
  }
  try {
    await prisma.todo.deleteMany({ where: { id, listId } });
    return c.json({ message: "Todo deleted successfully" });
  } catch (error) {
    return c.json({ message: "Error deleting todo", error }, 500);
  }
});

// ユーザー登録エンドポイント
app.post("/signup", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "メールアドレスとパスワードは必須です" }, 400);
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const token = await sign(
      { userId: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
      JWT_SECRET
    );

    return c.json(
      { message: "ユーザー登録が完了しました", token, email: user.email },
      201,
    );
  } catch (error: any) {
    if (error.code === "P2002") {
      return c.json({ error: "このメールアドレスは既に登録されています" }, 400);
    }
    return c.json({ error: "ユーザー登録に失敗しました" }, 500);
  }
});

//ログインエンドポイント
app.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return c.json({ error: "ユーザーが見つかりません" }, 404);
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return c.json({ error: "パスワードが正しくありません" }, 401);
    }

    const token = await sign(
      { userId: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
      JWT_SECRET
    );

    return c.json({
      message: "ログインに成功しました",
      token,
      email: user.email,
    });
  } catch (error) {
    return c.json({ error: "ログインに失敗しました" }, 500);
  }
});

export default app;

serve(
  {
    fetch: app.fetch,
    port: 3000,
    hostname: "0.0.0.0",
  },
  (info) => {
    console.log(`Server is running on http://0.0.0.0:${info.port}`);
  },
);
