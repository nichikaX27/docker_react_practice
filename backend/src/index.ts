import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { compare } from "bcryptjs";
import { use } from "hono/jsx";

const app = new Hono();
const prisma = new PrismaClient();

// CORSを許可
app.use(cors({ origin: "*" }));

// ルートエンドポイント
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// TODOリスト取得エンドポイント（ユーザーIDでフィルタリング）
app.get("/lists", async (c) => {
  const userId = Number(c.req.query("userId"));
  const list = await prisma.todoList.findMany({
    where: { userId: userId || 0 },
    include: { _count: { select: { todos: true } } }, // 各リストに関連するTODOの数を取得
  });
  return c.json({ list });
});

// TODOリスト作成エンドポイント
app.post("/lists", async (c) => {
  const { name, userId } = await c.req.json();
  const newList = await prisma.todoList.create({
    data: {
      name: name,
      userId: Number(userId), // ユーザーIDを保存
    },
  });
  return c.json(newList);
});

// TODOリスト取得エンドポイント
app.get("/todos", async (c) => {
  const listId = Number(c.req.query("listId"));
  const todos = await prisma.todo.findMany({
    where: { listId: listId || 0 },
    orderBy: { id: "asc" },
  });
  return c.json({ todos });
});

// TODO作成エンドポイント
app.post("/todos", async (c) => {
  const { title, listId } = await c.req.json();
  const newTodo = await prisma.todo.create({
    data: {
      title,
      completed: false,
      listId: Number(listId),
    },
  });
  return c.json(newTodo);
});

//Todolist削除エンドポイント
app.delete("/lists/:id", async (c) => {
  const id = Number(c.req.param("id"));
  try {
    await prisma.todoList.delete({
      where: { id },
    });
    return c.json({ message: "Todo list deleted successfully" });
  } catch (error) {
    return c.json({ message: "Error deleting todo list", error }, 500);
  }
});

// 完了したTODO一括削除エンドポイント
app.delete("/todos/completed/all", async (c) => {
  try {
    const listId = Number(c.req.query("listId"));
    const result = await prisma.todo.deleteMany({
      where: {
        listId: listId,
        completed: true,
      },
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
  const id = Number(c.req.param("id"));
  const listId = Number(c.req.query("listId"));
  const {title, completed} = await c.req.json();

  const upDateData: any = {};
  if (title !== undefined) upDateData.title = title;
  if (completed !== undefined) upDateData.completed = completed;

  if (Object.keys(upDateData).length === 0) {
    return c.json({ message: "更新するデータがありません" }, 400);
  }

  try {
  const updatedTodo = await prisma.todo.updateMany({
    where: {
      id: id,
      listId: listId, // リストIDも条件に追加
    }
    ,data: upDateData,
  });
  return c.json(updatedTodo);} catch (error) {
    console.error("Prisma error:", error);
    return c.json({ message: "Error updating todo", error }, 500);
  }
});

// TODO削除エンドポイント
app.delete("/todos/:id", async (c) => {
  const id = Number(c.req.param("id"));
  try {
    await prisma.todo.deleteMany({
      where: {
        id: id,
        listId: Number(c.req.query("listId")), // リストIDも条件に追加
      },
    });
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
      data: {
        email,
        password: hashedPassword,
      },
    });

    return c.json(
      { message: "ユーザー登録が完了しました", userId: user.id },
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

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return c.json({ error: "ユーザーが見つかりません" }, 404);
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return c.json({ error: "パスワードが正しくありません" }, 401);
    }

    return c.json({
      message: "ログインに成功しました",
      userId: user.id,
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
