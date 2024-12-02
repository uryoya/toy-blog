import { z } from "npm:zod";

export const SignUpForm = z.object({
  email: z.string(),
  password: z.string(),
  name: z.string(),
});

export const SignInForm = z.object({
  email: z.string(),
  password: z.string(),
});

export const UserUpdateForm = z.object({
  name: z.string(),
});

export const ArticleCreateForm = z.object({
  title: z.string(),
  content: z.string(),
});

export const ArticleUpdateForm = z.object({
  title: z.string(),
  content: z.string(),
});
