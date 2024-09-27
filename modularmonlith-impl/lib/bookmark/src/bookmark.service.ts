import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { and, eq } from "drizzle-orm";
import * as t from "db";
import {
  AddBookmarkInput,
  RemoveBookmarkInput,
} from "./bookmark.service.types";
import { Bookmark } from "./model/bookmark";
import { User } from "./model/user";
import { Article } from "./model/article";

export type BookmarkService = {
  // query
  findManyByUserId: (userId: string) => Promise<Bookmark[]>;
  // command
  addBookmark: (
    input: AddBookmarkInput
  ) => Promise<Bookmark | BookmarkServiceError>;
  removeBookmark: (
    input: RemoveBookmarkInput
  ) => Promise<null | BookmarkServiceError>;
};

export class BookmarkServiceError extends Error {
  static {
    this.prototype.name = "BookmarkServiceError";
  }
}

type Dependency = {
  db: PostgresJsDatabase;
  findUser: (id: string) => Promise<User | null>;
  findArticle: (id: string) => Promise<Article | null>;
};

export const BookmarkService = ({
  db,
  findUser,
  findArticle,
}: Dependency): BookmarkService => {
  return {
    // query
    findManyByUserId: async (userId) => {
      const bookmarks = await db
        .select({
          userId: t.Bookmark.userId,
          articleId: t.Bookmark.articleId,
          createdAt: t.Bookmark.createdAt,
        })
        .from(t.Bookmark)
        .where(eq(t.Bookmark.userId, userId));
      return bookmarks;
    },
    // command
    addBookmark: async (input) => {
      const user = await findUser(input.userId);
      if (!user) {
        return new BookmarkServiceError("User not found");
      }
      const article = await findArticle(input.articleId);
      if (!article) {
        return new BookmarkServiceError("Article not found");
      }
      const [existsBookmark] = await db
        .select({
          userId: t.Bookmark.userId,
          articleId: t.Bookmark.articleId,
          createdAt: t.Bookmark.createdAt,
        })
        .from(t.Bookmark)
        .where(
          and(
            eq(t.Bookmark.userId, user.id),
            eq(t.Bookmark.articleId, article.id)
          )
        );
      if (existsBookmark) {
        return existsBookmark;
      }

      const bookmark: Bookmark = {
        userId: input.userId,
        articleId: input.articleId,
        createdAt: new Date(),
      };
      await db.insert(t.Bookmark).values(bookmark);

      return bookmark;
    },
    removeBookmark: async (input) => {
      const user = await findUser(input.userId);
      if (!user) {
        return new BookmarkServiceError("User not found");
      }
      const article = await findArticle(input.articleId);
      if (!article) {
        return new BookmarkServiceError("Article not found");
      }

      await db
        .delete(t.Bookmark)
        .where(
          and(
            eq(t.Bookmark.userId, user.id),
            eq(t.Bookmark.articleId, article.id)
          )
        );

      return null;
    },
  };
};
