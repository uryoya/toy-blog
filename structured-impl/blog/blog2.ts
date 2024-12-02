import { Article } from "./article/model/article.ts";
import { ArticleService } from "./article/service.ts";
import { AuthToken } from "./auth/model/authToken.ts";
import { AuthService } from "./auth/service.ts";
import { Bookmark } from "./bookmark/model/bookmark.ts";
import { BookmarkService } from "./bookmark/service.ts";
import { User } from "./user/model/user.ts";
import { UserService } from "./user/service.ts";

export type BlogSystem2 = NoAuthFeature | UserAuthFeature;

export type NoAuthFeature = {
  createAccount: (
    email: string,
    password: string,
    name: string
  ) => [User, AuthToken];
  login: (email: string, password: string) => AuthToken;
};

export type UserAuthFeature = {
  logout: () => void;
  user: {
    update: (name: string) => User;
  };
  article: {
    create: (title: string, name: string) => Article;
    update: (id: string, title?: string, content?: string) => Article;
    delete: (id: string) => void;
  };
  bookmark: {
    add: (articleId: string) => Bookmark;
    remove: (articleId: string) => void;
  };
};

const noAuthFeature = (
  authService: AuthService,
  userService: UserService
): NoAuthFeature => ({
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
});

const userAuthFeature =
  (
    authService: AuthService,
    userService: UserService,
    articleService: ArticleService,
    bookmarkService: BookmarkService
  ) =>
  (token: string): UserAuthFeature => {
    const auth = authService.checkToken(token);

    return {
      logout: () => {
        authService.logout(token);
      },
      user: {
        update: (name) => {
          return userService.update(auth.id, name);
        },
      },
      article: {
        create: (title, content) => {
          const user = userService.find(auth.id);
          if (!user) {
            throw new Error("User not found");
          }
          return articleService.create(user, title, content);
        },
        update: (id, title, content) => {
          const user = userService.find(auth.id);
          if (!user) {
            throw new Error("User not found");
          }
          return articleService.update(user, id, title, content);
        },
        delete: (id) => {
          const user = userService.find(auth.id);
          if (!user) {
            throw new Error("User not found");
          }
          articleService.delete(user, id);
        },
      },
      bookmark: {
        add: (articleId) => {
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
        remove: (articleId) => {
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

export const BlogSystem2 = () => {
  const authService = {} as AuthService;
  const userService = {} as UserService;
  const articleService = {} as ArticleService;
  const bookmarkService = {} as BookmarkService;

  return {
    noAuth: noAuthFeature(authService, userService),
    userAuth: userAuthFeature(
      authService,
      userService,
      articleService,
      bookmarkService
    ),
  };
};
