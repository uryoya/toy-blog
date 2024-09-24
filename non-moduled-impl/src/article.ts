import { Hono } from "hono";
import { auth, injectPrisma } from "./middleware";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { randomUUID } from "crypto";
import { HTTPException } from "hono/http-exception";

const CreateArticleForm = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const articleApp = new Hono().use(injectPrisma);

articleApp.post("/", auth, zValidator("json", CreateArticleForm), async (c) => {
  const form = c.req.valid("json");
  const user = c.get("user");
  const prisma = c.get("prisma");

  const article = await prisma.article.create({
    data: {
      id: randomUUID(),
      title: form.title,
      content: form.content,
      authorId: user.id,
    },
  });

  return c.json(article);
});

articleApp.get("/", async (c) => {
  const prisma = c.get("prisma");
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      authorId: true,
      title: true,
    },
  });
  return c.json(articles);
});

articleApp.post("/:id", auth, (c) => c.text("no implemented"));

articleApp.get("/:id", async (c) => {
  const articleId = c.req.param("id");
  const prisma = c.get("prisma");
  const article = await prisma.article.findFirst({
    select: {
      id: true,
      author: {
        select: {
          id: true,
          profile: {
            select: {
              username: true,
            },
          },
        },
      },
      title: true,
      content: true,
    },
    where: {
      id: articleId,
    },
  });

  if (!article) {
    throw new HTTPException(404, { message: "Article not found" });
  }

  return c.json(article);
});

articleApp.delete("/:id", auth, async (c) => {
  const articleId = c.req.param("id");
  const user = c.get("user");
  const prisma = c.get("prisma");

  const article = await prisma.article.findFirst({
    select: {
      id: true,
      authorId: true,
    },
    where: {
      id: articleId,
      authorId: user.id,
    },
  });
  if (!article) {
    throw new HTTPException(404, { message: "Article not found" });
  }

  await prisma.article.delete({ where: { id: article.id } });
  return c.json({});
});

articleApp.post("/:id/bookmark", auth, async (c) => {
  const articleId = c.req.param("id");
  const user = c.get("user");
  const prisma = c.get("prisma");

  const article = await prisma.article.findFirst({
    where: { id: articleId },
  });
  if (!article) {
    throw new HTTPException(404, { message: "Article not found" });
  }

  const existsBookmark = await prisma.bookmark.findFirst({
    where: { userId: user.id, articleId: article.id },
  });
  if (existsBookmark) {
    return c.json(existsBookmark);
  }

  const bookmark = await prisma.bookmark.create({
    data: {
      userId: user.id,
      articleId: article.id,
    },
  });

  return c.json(bookmark);
});

articleApp.post("/:id/unbookmark", auth, async (c) => {
  const articleId = c.req.param("id");
  const user = c.get("user");
  const prisma = c.get("prisma");

  await prisma.bookmark.deleteMany({
    where: {
      userId: user.id,
      articleId,
    },
  });

  return c.json({});
});
