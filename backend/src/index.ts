import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient } from '@prisma/client'
import { hash } from "bcryptjs";

const app = new Hono();
const prisma = new PrismaClient();

app.use(cors({ origin: "*" }));

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/todos", async (c) => {
  const todos = await prisma.todo.findMany({
    where: { userId: 1 }, 
    orderBy: { id: 'asc' }
  })
  return c.json({ todos }); 
});

app.post("/todos", async (c) => {
  const { title } = await c.req.json();

  if (!title || title.trim() === "") {
    return c.json({ error: "入力がありません" }, 400);
  }

  const newTodo = await prisma.todo.create({
    data: {
      title,
      completed: false,
      userId: 1, // 先ほどSQLで作成したユーザーID
    }
  })
  return c.json(newTodo);
})

app.delete("/todos/completed/all", async (c) => {
  try {
    const result = await prisma.todo.deleteMany({
      where: { 
        userId: 1, // 自分のTODOだけ消すように制限
        completed: true 
      },
    });
    return c.json({ message: `${result.count} 件の完了したTodoを削除しました。` });
  }
  catch (error) {
    return c.json({ error: "一括削除に失敗しました" }, 500);
  }
});

app.put("/todos/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const { completed } = await c.req.json();
  const updatedTodo = await prisma.todo.update({
    where: { id },
    data: { completed },
  });
  return c.json(updatedTodo);
});

app.delete("/todos/:id", async (c) => {
  const id = Number(c.req.param("id"));
  try {
    await prisma.todo.delete({
      where: { id },
    });
    return c.json({ message: "Todo deleted successfully" });
  } catch (error) {
    return c.json({ message: "Error deleting todo", error }, 500);
  }
});

app.post("/signup", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if(!email || !password) {
      return c.json({ error: "メールアドレスとパスワードは必須です" }, 400);
    }

    const hashedPassword = await hash(password,10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    
    return c.json({ message: "ユーザー登録が完了しました", userId: user.id }, 201);
  } catch (error:any) {
    if(error.code === 'P2002') {
      return c.json({ error: "このメールアドレスは既に登録されています" }, 400);
    }
    return c.json({ error: "ユーザー登録に失敗しました" }, 500);
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
  }
);