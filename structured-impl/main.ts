import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";
import { zValidator } from "npm:@hono/zod-validator";
import { BlogSystem } from "./blog/blog.ts";
import { ArticleCreateForm, SignUpForm, UserUpdateForm } from "./schema.ts";

const blogSystem = BlogSystem();

const bearerAuth = createMiddleware<{ Variables: { bearerToken: string } }>(
  async (c, next) => {
    const bearerToken = c.req.header("Authorization");
    if (!bearerToken) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }
    if (!bearerToken.startsWith("Bearer")) {
      throw new HTTPException(400, { message: "require bearer token" });
    }
    const token = bearerToken.replace("Bearer ", "");
    c.set("bearerToken", token);
    await next();
  }
);

const app = new Hono();

app.post("/signup", zValidator("json", SignUpForm), (c) => {
  const form = c.req.valid("json");
  const [user, userAuth] = blogSystem.createAccount(
    form.email,
    form.password,
    form.name
  );
  return c.json({ user, userAuth });
});

app.post("/login", zValidator("json", SignUpForm), (c) => {
  const form = c.req.valid("json");
  const user = blogSystem.login(form.email, form.password);
  return c.json(user);
});

app.post("/logout", bearerAuth, (c) => {
  const token = c.get("bearerToken");
  blogSystem.logout(token ?? "");
  return c.json({});
});

app.post("/user/edit", bearerAuth, zValidator("json", UserUpdateForm), (c) => {
  const token = c.get("bearerToken");
  const form = c.req.valid("json");
  const user = blogSystem.user.update(token)(form.name);
  return c.json(user);
});

app.post("/article", bearerAuth, zValidator("json", ArticleCreateForm), (c) => {
  const token = c.get("bearerToken");
  const form = c.req.valid("json");
  const article = blogSystem.article.create(token)(form.title, form.content);
  return c.json(article);
});

app.post(
  "/article/:id",
  bearerAuth,
  zValidator("json", ArticleCreateForm),
  (c) => {
    const token = c.get("bearerToken");
    const form = c.req.valid("json");
    const article = blogSystem.article.update(token)(
      c.req.param("id"),
      form.title,
      form.content
    );
    return c.json(article);
  }
);

app.delete("/article/:id", bearerAuth, (c) => {
  const token = c.get("bearerToken");
  blogSystem.article.delete(token)(c.req.param("id"));
  return c.json({});
});

app.post("/bookmark/:id", bearerAuth, (c) => {
  const token = c.get("bearerToken");
  const bookmark = blogSystem.bookmark.add(token)(c.req.param("id"));
  return c.json(bookmark);
});

app.delete("/bookmark/:id", bearerAuth, (c) => {
  const token = c.get("bearerToken");
  blogSystem.bookmark.remove(token)(c.req.param("id"));
  return c.json({});
});

Deno.serve(app.fetch);
