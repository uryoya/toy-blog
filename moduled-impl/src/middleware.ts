import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient, User } from "@prisma/client";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { UserService } from "./user/user.service";
import { ArticleService } from "./article/article.service";
import { BookmarkService } from "./bookmark/bookmark.service";

type AuthEnv = {
  Variables: {
    user: User;
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

const prisma = new PrismaClient();

const pgClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(pgClient);

const userService = UserService({ supabase, db });
const articleService = ArticleService({ db, UserService: userService });
const bookmarkService = BookmarkService({
  db,
  UserService: userService,
  ArticleService: articleService,
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
  const user = await prisma.user.findFirst({
    where: { id: data.user.id },
  });
  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }

  c.set("user", user);
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
