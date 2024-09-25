export type Article = {
  id: string;
  title: string;
  content: string;
  authorId: string;
};

export type ArticleCreated = {
  article: Article;
  createdAt: Date;
};

export type ArticleUpdated = {
  article: Article;
  updatedAt: Date;
};
