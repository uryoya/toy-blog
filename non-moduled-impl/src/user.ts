import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth, injectPrisma, injectSupabase } from "./middleware";

const SignUpForm = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  username: z.string().min(1).max(20),
  bio: z.string(),
  avatar: z.string().url(),
  website: z.string().url(),
});

const SignInForm = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const userApp = new Hono().use(injectPrisma).use(injectSupabase);

userApp.post("/signup", zValidator("json", SignUpForm), async (c) => {
  const form = c.req.valid("json");
  const prisma = c.get("prisma");
  const supabase = c.get("supabase");
  const userExists = await prisma.user.findFirst({
    select: { id: true },
    where: { email: form.email },
  });
  if (userExists) {
    throw new HTTPException(400, { message: "User already exists" });
  }
  const { data: userAuth, error } = await supabase.auth.admin.createUser({
    email: form.email,
    email_confirm: false,
    password: form.password,
  });
  if (error) {
    console.error(error);
    throw new HTTPException(500, { message: "Failed to create user" });
  }
  const user = await prisma.user.create({
    data: {
      id: userAuth.user.id,
      email: form.email,
      profile: {
        create: {
          username: form.username,
          bio: form.bio,
          avatar: form.avatar,
          website: form.website,
        },
      },
    },
  });
  return c.json(user);
});

userApp.post("/signin", zValidator("json", SignInForm), async (c) => {
  const form = c.req.valid("json");
  const supabase = c.get("supabase");
  const { data, error } = await supabase.auth.signInWithPassword(form);
  if (error) {
    console.log(error);
    throw new HTTPException(401, { message: "Failed to sign in" });
  }
  return c.json(data.session);
});

userApp.post("/signout", auth, async (c) => {
  const user = c.get("user");
  const supabase = c.get("supabase");
  await supabase.auth.admin.signOut(user.id);
});

userApp.get("/me", auth, async (c) => {
  const user = c.get("user");
  const prisma = c.get("prisma");
  const userProfile = await prisma.userProfile.findFirstOrThrow({
    where: { userId: user.id },
  });
  const userFollowing = await prisma.follow.findMany({
    select: {
      followee: {
        select: {
          id: true,
          profile: {
            select: {
              username: true,
              avatar: true,
            },
          },
        },
      },
    },
    where: { userId: user.id },
  });
  const userFollowers = await prisma.follow.findMany({
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          profile: {
            select: {
              username: true,
              avatar: true,
            },
          },
        },
      },
    },
    where: { followeeId: user.id },
  });
  return c.json({
    ...user,
    profile: userProfile,
    following: userFollowing.map(({ followee }) => followee),
    followers: userFollowers.map(({ user }) => user),
  });
});

userApp.post("/:id/follow", auth, async (c) => {
  const followeeId = c.req.param("id");
  const user = c.get("user");
  const prisma = c.get("prisma");

  if (user.id === followeeId) {
    throw new HTTPException(400, { message: "Cannot follow myself" });
  }

  const followee = await prisma.user.findFirst({
    where: { id: followeeId },
  });
  if (!followee) {
    throw new HTTPException(404, { message: "User not found" });
  }

  const existsFollow = await prisma.follow.findFirst({
    where: { userId: user.id, followeeId },
  });
  if (existsFollow) {
    return c.json(existsFollow);
  }

  const follow = await prisma.follow.create({
    data: {
      userId: user.id,
      followeeId: followee.id,
    },
  });

  return c.json(follow);
});

userApp.post("/:id/unfollow", auth, async (c) => {
  const followeeId = c.req.param("id");
  const user = c.get("user");
  const prisma = c.get("prisma");

  await prisma.follow.deleteMany({
    where: {
      userId: user.id,
      followeeId: followeeId,
    },
  });

  return c.json({});
});
