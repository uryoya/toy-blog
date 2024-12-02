import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";
import { zValidator } from "npm:@hono/zod-validator";
import { ArticleCreateForm, SignUpForm, UserUpdateForm } from "./schema.ts";
import { BlogSystem2, NoAuthFeature, UserAuthFeature } from "./blog/blog2.ts";

const noAuth = createMiddleware<{ Variables: { blogSystem: NoAuthFeature } }>(
  async (c, next) => {
    c.set("blogSystem", BlogSystem2().noAuth);
    await next();
  }
);

const userAuth = createMiddleware<{
  Variables: { blogSystem: UserAuthFeature };
}>(async (c, next) => {
  const bearerToken = c.req.header("Authorization");
  if (!bearerToken) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  if (!bearerToken.startsWith("Bearer")) {
    throw new HTTPException(400, { message: "require bearer token" });
  }
  const token = bearerToken.replace("Bearer ", "");
  c.set("blogSystem", BlogSystem2().userAuth(token));
  await next();
});

const app = new Hono();

app.post("/signup", noAuth, zValidator("json", SignUpForm), (c) => {
  const blogSystem = c.get("blogSystem");
  const form = c.req.valid("json");
  const [user, userAuth] = blogSystem.createAccount(
    form.email,
    form.password,
    form.name
  );
  return c.json({ user, userAuth });
});

app.post("/login", noAuth, zValidator("json", SignUpForm), (c) => {
  const blogSystem = c.get("blogSystem");
  const form = c.req.valid("json");
  const user = blogSystem.login(form.email, form.password);
  return c.json(user);
});

app.post("/logout", userAuth, (c) => {
  const blogSystem = c.get("blogSystem");
  blogSystem.logout();
  return c.json({});
});

app.post("/user/edit", userAuth, zValidator("json", UserUpdateForm), (c) => {
  const blogSystem = c.get("blogSystem");
  const form = c.req.valid("json");
  const user = blogSystem.user.update(form.name);
  return c.json(user);
});

app.post("/article", userAuth, zValidator("json", ArticleCreateForm), (c) => {
  const blogSystem = c.get("blogSystem");
  const form = c.req.valid("json");
  const article = blogSystem.article.create(form.title, form.content);
  return c.json(article);
});

app.post(
  "/article/:id",
  userAuth,
  zValidator("json", ArticleCreateForm),
  (c) => {
    const blogSystem = c.get("blogSystem");
    const form = c.req.valid("json");
    const article = blogSystem.article.update(
      c.req.param("id"),
      form.title,
      form.content
    );
    return c.json(article);
  }
);

app.delete("/article/:id", userAuth, (c) => {
  const blogSystem = c.get("blogSystem");
  blogSystem.article.delete(c.req.param("id"));
  return c.json({});
});

app.post("/bookmark/:id", userAuth, (c) => {
  const blogSystem = c.get("blogSystem");
  const bookmark = blogSystem.bookmark.add(c.req.param("id"));
  return c.json(bookmark);
});

app.delete("/bookmark/:id", userAuth, (c) => {
  const blogSystem = c.get("blogSystem");
  blogSystem.bookmark.remove(c.req.param("id"));
  return c.json({});
});

Deno.serve(app.fetch);
