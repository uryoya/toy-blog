export type Article = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
};

export type ArticleUpdated = {
  article: Article;
  updatedAt: Date;
};
