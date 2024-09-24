import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { PrismaClient, User } from "@prisma/client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type SupabaseEnv = {
  Variables: {
    supabase: SupabaseClient;
  };
};

type PrismaEnv = {
  Variables: {
    prisma: PrismaClient;
  };
};

export type AuthEnv = {
  Variables: {
    user: User;
  };
};

const prisma = new PrismaClient();

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

export const injectSupabase = createMiddleware<SupabaseEnv>(async (c, next) => {
  c.set("supabase", supabase);
  await next();
});

export const injectPrisma = createMiddleware<PrismaEnv>(async (c, next) => {
  c.set("prisma", prisma);
  await next();
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
