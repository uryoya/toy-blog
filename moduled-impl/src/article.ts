import { Hono } from "hono";
import {
  auth,
  injectArticleService,
  injectBookmarkService,
} from "./middleware";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";

const PostArticleForm = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

const UpdateArticleForm = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const articleApp = new Hono()
  .use(injectArticleService)
  .use(injectBookmarkService)

  .post("/", auth, zValidator("json", PostArticleForm), async (c) => {
    const form = c.req.valid("json");
    const user = c.get("user");
    const ArticleService = c.get("ArticleService");

    const result = await ArticleService.post({
      ...form,
      authorId: user.id,
    });
    if (result instanceof Error) {
      throw new HTTPException(400, { message: result.message });
    }

    return c.json(result);
  })

  .get("/", async (c) => {
    const ArticleService = c.get("ArticleService");
    const articles = await ArticleService.findMany();
    return c.json(articles);
  })

  .post("/:id", auth, zValidator("json", UpdateArticleForm), async (c) => {
    const articleId = c.req.param("id");
    const form = c.req.valid("json");
    const user = c.get("user");
    const ArticleService = c.get("ArticleService");

    const result = await ArticleService.update({
      id: articleId,
      authorId: user.id,
      ...form,
    });
    if (result instanceof Error) {
      throw new HTTPException(400, { message: result.message });
    }

    return c.json(result);
  })

  .get("/:id", async (c) => {
    const articleId = c.req.param("id");
    const ArticleService = c.get("ArticleService");

    const article = await ArticleService.find(articleId);

    if (!article) {
      throw new HTTPException(404, { message: "Article not found" });
    }

    return c.json(article);
  })

  .delete("/:id", auth, async (c) => {
    const articleId = c.req.param("id");
    const user = c.get("user");
    const ArticleService = c.get("ArticleService");

    const result = await ArticleService.delete({
      id: articleId,
      authorId: user.id,
    });
    if (result instanceof Error) {
      throw new HTTPException(400, { message: result.message });
    }

    return c.json({});
  })

  .post("/:id/bookmark", auth, async (c) => {
    const articleId = c.req.param("id");
    const user = c.get("user");
    const BookmarkService = c.get("BookmarkService");

    const result = await BookmarkService.addBookmark({
      userId: user.id,
      articleId,
    });
    if (result instanceof Error) {
      throw new HTTPException(400, { message: result.message });
    }

    return c.json(result);
  })

  .post("/:id/unbookmark", auth, async (c) => {
    const articleId = c.req.param("id");
    const user = c.get("user");
    const BookmarkService = c.get("BookmarkService");

    const result = await BookmarkService.removeBookmark({
      userId: user.id,
      articleId,
    });
    if (result instanceof Error) {
      throw new HTTPException(400, { message: result.message });
    }

    return c.json({});
  });
