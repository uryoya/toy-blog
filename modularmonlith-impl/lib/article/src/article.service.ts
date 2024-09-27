import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, max } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as t from "db";
import {
  DeleteArticleInput,
  PostArticleInput,
  UpdateArticleInput,
} from "./article.service.types";
import { Article, ArticleUpdated } from "./model/article";
import { User } from "./model/user";

export type ArticleService = {
  // query
  find: (id: string) => Promise<Article | null>;
  findMany: () => Promise<Article[]>;
  // command
  post: (input: PostArticleInput) => Promise<Article | ArticleServiceError>;
  update: (
    input: UpdateArticleInput
  ) => Promise<ArticleUpdated | ArticleServiceError>;
  delete: (input: DeleteArticleInput) => Promise<null | ArticleServiceError>;
};

export class ArticleServiceError extends Error {
  static {
    this.prototype.name = "ArticleServiceError";
  }
}

type Dependency = {
  db: PostgresJsDatabase;
  findUser: (id: string) => Promise<User | null>;
};

export const ArticleService = ({
  db,
  findUser,
}: Dependency): ArticleService => {
  const findArticle = async (id: string) => {
    // const lastUpdatedQuery = db
    //   .select({
    //     articleId: t.ArticleUpdated.articleId,
    //     updatedAt: max(t.ArticleUpdated.updatedAt).as("updatedAt"),
    //   })
    //   .from(t.ArticleUpdated)
    //   .where(eq(t.ArticleUpdated.articleId, id))
    //   .groupBy(t.ArticleUpdated.articleId)
    //   .as("lastUpdatedQuery");
    const [article] = await db
      .select({
        id: t.Article.id,
        title: t.Article.title,
        content: t.Article.content,
        authorId: t.Article.authorId,
        createdAt: t.Article.createdAt,
        // updatedAt: lastUpdatedQuery.updatedAt,
      })
      .from(t.Article)
      // .innerJoin(t.ArticleCreated, eq(t.Article.id, t.ArticleCreated.articleId))
      // .leftJoin(lastUpdatedQuery, eq(t.Article.id, lastUpdatedQuery.articleId))
      .where(eq(t.Article.id, id));
    return article ?? null;
  };

  return {
    // query
    find: findArticle,
    findMany: async () => {
      // const lastUpdatedQuery = db
      //   .select({
      //     articleId: t.ArticleUpdated.articleId,
      //     updatedAt: max(t.ArticleUpdated.updatedAt)
      //       .mapWith(t.ArticleUpdated.updatedAt)
      //       .as("updatedAt"),
      //   })
      //   .from(t.ArticleUpdated)
      //   .groupBy(t.ArticleUpdated.articleId)
      //   .as("lastUpdatedQuery");
      const articles = await db
        .select({
          id: t.Article.id,
          title: t.Article.title,
          content: t.Article.content,
          authorId: t.Article.authorId,
          createdAt: t.Article.createdAt,
          // updatedAt: lastUpdatedQuery.updatedAt,
        })
        .from(t.Article);
      // .innerJoin(
      //   t.ArticleCreated,
      //   eq(t.Article.id, t.ArticleCreated.articleId)
      // )
      // .leftJoin(
      //   lastUpdatedQuery,
      //   eq(t.Article.id, lastUpdatedQuery.articleId)
      // );
      return articles;
    },
    // command
    post: async (input) => {
      const author = await findUser(input.authorId);
      if (!author) {
        return new ArticleServiceError("Author not found");
      }
      const article: Article = {
        id: randomUUID(),
        title: input.title,
        content: input.content,
        authorId: author.id,
        createdAt: new Date(),
      };

      await db.insert(t.Article).values(article);

      return article;
    },
    update: async (input) => {
      const author = await findUser(input.authorId);
      if (!author) {
        return new ArticleServiceError("Author not found");
      }
      const article = await findArticle(input.id);
      if (!article) {
        return new ArticleServiceError("Article not found");
      }
      // TODO: 記事の作者と操作をしているユーザーを検証する操作は単一責任の原則に反している感じがする
      if (article.authorId !== author.id) {
        return new ArticleServiceError("Can not update other user's article");
      }

      const articleUpdated: ArticleUpdated = {
        article: {
          ...article,
          title: input.title,
          content: input.content,
        },
        updatedAt: new Date(),
      };

      await db.transaction(async (tx) => {
        const { article, updatedAt } = articleUpdated;
        await tx
          .update(t.Article)
          .set({
            title: article.title,
            content: article.content,
          })
          .where(eq(t.Article.id, article.id));
        await tx.insert(t.ArticleUpdated).values({
          articleId: article.id,
          updatedAt: updatedAt,
        });
      });

      return articleUpdated;
    },
    delete: async (input) => {
      const author = await findUser(input.authorId);
      if (!author) {
        return new ArticleServiceError("Author not found");
      }
      const article = await findArticle(input.id);
      if (!article) {
        return new ArticleServiceError("Article not found");
      }
      if (article.authorId !== author.id) {
        return new ArticleServiceError("Can not delete other user's article");
      }

      await db.transaction(async (tx) => {
        await tx
          .delete(t.ArticleUpdated)
          .where(eq(t.ArticleUpdated.articleId, article.id));
        await tx.delete(t.Article).where(eq(t.Article.id, article.id));
      });

      return null;
    },
  };
};
