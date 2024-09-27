import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { UserService } from "user";
import { ArticleService } from "article";
import { BookmarkService } from "bookmark";

type AuthEnv = {
  Variables: {
    user: {
      id: string;
    };
  };
};

type UserServiceEnv = {
  Variables: {
    UserService: UserService;
  };
};

type ArticleServiceEnv = {
  Variables: {
    ArticleService: ArticleService;
  };
};

type BookmarkServiceEnv = {
  Variables: {
    BookmarkService: BookmarkService;
  };
};

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const pgClient = postgres(process.env.DATABASE_URL!, { database: "postgres" });
const db = drizzle(pgClient);

const userService = UserService({
  supabase,
  db,
});
const articleService = ArticleService({
  db,
  findUser: userService.find,
});
const bookmarkService = BookmarkService({
  db,
  findUser: userService.find,
  findArticle: articleService.find,
});

export const auth = createMiddleware<AuthEnv>(async (c, next) => {
  const bearerToken = c.req.header("Authorization");
  if (!bearerToken) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  if (!bearerToken.startsWith("Bearer")) {
    throw new HTTPException(400, { message: "require bearer token" });
  }
  const token = bearerToken.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    throw new HTTPException(401, { message: error.message });
  }

  c.set("user", data.user);
  await next();
});

export const injectUserService = createMiddleware<UserServiceEnv>(
  async (c, next) => {
    c.set("UserService", userService);
    await next();
  }
);

export const injectArticleService = createMiddleware<ArticleServiceEnv>(
  async (c, next) => {
    c.set("ArticleService", articleService);
    await next();
  }
);

export const injectBookmarkService = createMiddleware<BookmarkServiceEnv>(
  async (c, next) => {
    c.set("BookmarkService", bookmarkService);
    await next();
  }
);
