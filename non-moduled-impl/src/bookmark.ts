import { Hono } from "hono";
import { auth, injectPrisma } from "./middleware";
import { HTTPException } from "hono/http-exception";

export const bookmarkApp = new Hono().use(injectPrisma);

bookmarkApp.get("/", auth, async (c) => {
  const user = c.get("user");
  const prisma = c.get("prisma");
  const bookmarks = await prisma.bookmark.findMany({
    select: {
      article: {
        select: {
          id: true,
          title: true,
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
        },
      },
    },
    where: {
      userId: user.id,
    },
  });
  return c.json(bookmarks.map(({ article }) => article));
});

bookmarkApp.post("/:articleId", auth, async (c) => {
  const articleId = c.req.param("articleId");
  const user = c.get("user");
  const prisma = c.get("prisma");

  const article = await prisma.article.findFirst({
    where: {
      id: articleId,
    },
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

bookmarkApp.delete("/:articleId", auth, async (c) => {
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
