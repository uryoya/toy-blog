import type { User } from "../user/model/user.ts";
import { Article } from "./model/article.ts";

export type ArticleService = {
  create: (author: User, title: string, content: string) => Article;
  update: (
    author: User,
    id: string,
    title?: string,
    content?: string
  ) => Article;
  delete: (author: User, id: string) => void;
  find: (id: string) => Article | null;
  findAll: () => Article[];
};
