import { serve } from '@hono/node-server'
import { Hono } from 'hono'

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}
const todos: Todo[] = [];
const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/todos', (c) => {
  return c.json({ todos });
});

app.post('/todos', async (c) => {
  const { title } = await c.req.json();
  const todo: Todo = {
    id: todos.length + 1,
    title,
    completed: false,
  };
  todos.push(todo);
  return c.json({todo});
});


app.put('/todos/:id', async(c) => {
  const id = c.req.param();
  const completed = await c.req.json();
  const todo = todos.find((todo) => todo.id === Number(id));
if(!todo) {
  return c.notFound();
}
  todo.completed = completed;
  return c.json({todo});
});

serve({
  fetch: app.fetch,
  port: 3001,
  hostname: '0.0.0.0'
}, (info) => {
  console.log(`Server is running on http://0.0.0.0:${info.port}`)
})
