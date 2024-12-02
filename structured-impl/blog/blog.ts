import { Article } from "./article/model/article.ts";
import { ArticleService } from "./article/service.ts";
import { AuthToken } from "./auth/model/authToken.ts";
import { AuthService } from "./auth/service.ts";
import { Bookmark } from "./bookmark/model/bookmark.ts";
import { BookmarkService } from "./bookmark/service.ts";
import { User } from "./user/model/user.ts";
import { UserService } from "./user/service.ts";

export type BlogSystem = {
  createAccount: (
    email: string,
    password: string,
    name: string
  ) => [User, AuthToken];
  login: (email: string, password: string) => AuthToken;
  logout: (token: AuthToken) => void;
  user: {
    update: (token: AuthToken) => (name: string) => User;
  };
  article: {
    create: (token: AuthToken) => (title: string, name: string) => Article;
    update: (
      token: AuthToken
    ) => (id: string, title?: string, content?: string) => Article;
    delete: (token: AuthToken) => (id: string) => void;
  };
  bookmark: {
    add: (token: AuthToken) => (articleId: string) => Bookmark;
    remove: (token: AuthToken) => (articleId: string) => void;
  };
};

export const BlogSystem = (): BlogSystem => {
  const authService = {} as AuthService;
  const userService = {} as UserService;
  const articleService = {} as ArticleService;
  const bookmarkService = {} as BookmarkService;

  return {
    createAccount: (email, password, name) => {
      if (authService.checkEmailExists(email)) {
        throw new Error("Email already exists");
      }
      const user = userService.create(name);
      return [user, authService.create(user.id, email, password)];
    },
    login: (email, password) => {
      return authService.login(email, password);
    },
    logout: (token) => {
      authService.logout(token);
    },
    user: {
      update: (token) => (name) => {
        const user = authService.checkToken(token);
        return userService.update(user.id, name);
      },
    },
    article: {
      create: (token) => (title, content) => {
        const auth = authService.checkToken(token);
        const user = userService.find(auth.id);
        if (!user) {
          throw new Error("User not found");
        }
        return articleService.create(user, title, content);
      },
      update: (token) => (id, title, content) => {
        const auth = authService.checkToken(token);
        const user = userService.find(auth.id);
        if (!user) {
          throw new Error("User not found");
        }
        return articleService.update(user, id, title, content);
      },
      delete: (token) => (id) => {
        const auth = authService.checkToken(token);
        const user = userService.find(auth.id);
        if (!user) {
          throw new Error("User not found");
        }
        articleService.delete(user, id);
      },
    },
    bookmark: {
      add: (token) => (articleId) => {
        const auth = authService.checkToken(token);
        const user = userService.find(auth.id);
        if (!user) {
          throw new Error("User not found");
        }
        const article = articleService.find(articleId);
        if (!article) {
          throw new Error("Article not found");
        }
        const bookmark = bookmarkService.add(user, article);
        return bookmark;
      },
      remove: (token) => (articleId) => {
        const auth = authService.checkToken(token);
        const user = userService.find(auth.id);
        if (!user) {
          throw new Error("User not found");
        }
        // // この場合、Articleが存在しなくてもBookmarkは存在する可能性があり、それをここで確認する必要はないのでは無いか？
        // const article = articleService.find(articleId);
        // if (!article) {
        //   throw new Error("Article not found");
        // }

        // ↑のコメントへの対応として、Bookmarkを特定する複合PKだけ指定すればOKとする実装
        bookmarkService.remove(user.id, articleId);
      },
    },
  };
};
