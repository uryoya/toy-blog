import { Hono } from "hono";
import { auth, injectBookmarkService } from "./middleware";
import { HTTPException } from "hono/http-exception";

export const bookmarkApp = new Hono()
  .use(injectBookmarkService)

  .get("/", auth, async (c) => {
    const user = c.get("user");
    const BookmarkService = c.get("BookmarkService");

    const result = await BookmarkService.findManyByUserId(user.id);

    return c.json(result);
  })

  .post("/:articleId", auth, async (c) => {
    const articleId = c.req.param("articleId");
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

  .delete("/:articleId", auth, async (c) => {
    const articleId = c.req.param("articleId");
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
