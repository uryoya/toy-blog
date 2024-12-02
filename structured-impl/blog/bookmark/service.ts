import type { Article } from "../article/model/article.ts";
import type { User } from "../user/model/user.ts";
import { Bookmark } from "./model/bookmark.ts";

export type BookmarkService = {
  add: (user: User, article: Article) => Bookmark;
  remove: (userId: string, articleId: string) => void;
};
