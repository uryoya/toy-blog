import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { and, eq } from "drizzle-orm";
import * as t from "../drizzle/schema";
import { ArticleService } from "../article/article.service";
import { UserService } from "../user/user.service";
import {
  AddBookmarkInput,
  RemoveBookmarkInput,
} from "./bookmark.service.types";
import { Bookmark } from "./model/bookmark";

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
  UserService: UserService;
  ArticleService: ArticleService;
};

export const BookmarkService = ({
  db,
  UserService,
  ArticleService,
}: Dependency): BookmarkService => ({
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
    const user = await UserService.find(input.userId);
    if (!user) {
      return new BookmarkServiceError("User not found");
    }
    const article = await ArticleService.find(input.articleId);
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
          eq(t.Bookmark.userId, input.userId),
          eq(t.Bookmark.articleId, input.articleId)
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
    const user = await UserService.find(input.userId);
    if (!user) {
      return new BookmarkServiceError("User not found");
    }
    const article = await ArticleService.find(input.articleId);
    if (!article) {
      return new BookmarkServiceError("Article not found");
    }

    await db
      .delete(t.Bookmark)
      .where(
        and(
          eq(t.Bookmark.userId, input.userId),
          eq(t.Bookmark.articleId, input.articleId)
        )
      );

    return null;
  },
});
