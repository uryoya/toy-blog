import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { userApp } from "./user";
import { articleApp } from "./article";
import { bookmarkApp } from "./bookmark";

const app = new Hono()
  .use(logger())
  .route("/user", userApp)
  .route("/article", articleApp)
  .route("/bookmark", bookmarkApp);

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
