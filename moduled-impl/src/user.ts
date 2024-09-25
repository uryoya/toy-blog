import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth, injectUserService } from "./middleware";

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

export const userApp = new Hono()
  .use(injectUserService)

  .post("/signup", zValidator("json", SignUpForm), async (c) => {
    const form = c.req.valid("json");
    const UserService = c.get("UserService");
    const result = await UserService.signUp(form);
    if (result instanceof Error) {
      console.log(result);
      throw new HTTPException(400, { message: result.message });
    }
    return c.json(result);
  })

  .post("/signin", zValidator("json", SignInForm), async (c) => {
    const form = c.req.valid("json");
    const UserService = c.get("UserService");
    const result = await UserService.signIn(form);
    if (result instanceof Error) {
      console.log(result);
      throw new HTTPException(401, { message: "Failed to sign in" });
    }
    return c.json(result);
  })

  .post("/signout", auth, async (c) => {
    const user = c.get("user");
    const UserService = c.get("UserService");
    const result = await UserService.signOut({ userId: user.id });
    if (result instanceof Error) {
      throw new HTTPException(400, { message: result.message });
    }
    return c.json(result);
  })

  .get("/me", auth, async (c) => {
    const user = c.get("user");
    const UserService = c.get("UserService");
    const result = await UserService.find(user.id);
    if (!result) {
      throw new HTTPException(404, { message: "User not found" });
    }
    return c.json(result);
  })

  .post("/:id/follow", auth, async (c) => {
    const followeeId = c.req.param("id");
    const user = c.get("user");
    const UserService = c.get("UserService");
    const result = await UserService.follow({
      userId: user.id,
      followeeId,
    });
    if (result instanceof Error) {
      console.log(result);
      throw new HTTPException(400, { message: result.message });
    }
    return c.json(result);
  })

  .post("/:id/unfollow", auth, async (c) => {
    const followeeId = c.req.param("id");
    const user = c.get("user");
    const UserService = c.get("UserService");
    const result = await UserService.unfollow({
      userId: user.id,
      followeeId,
    });
    if (result instanceof Error) {
      console.log(result);
      throw new HTTPException(400, { message: result.message });
    }
    return c.json(result);
  });
