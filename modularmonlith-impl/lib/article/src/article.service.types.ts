export type PostArticleInput = {
  title: string;
  content: string;
  authorId: string;
};

export type UpdateArticleInput = {
  id: string;
  title: string;
  content: string;
  authorId: string;
};

export type DeleteArticleInput = {
  id: string;
  authorId: string;
};
