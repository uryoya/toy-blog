export class ToyBlogServiceError extends Error {
  static {
    this.prototype.name = "ToyBlogServiceError";
  }
}

export type SignUpInput = {
  email: string;
  password: string;
  username: string;
  bio: string;
  avatar: string;
  website: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignOutInput = {
  userId: string;
};

export type FollowInput = {
  userId: string;
  followeeId: string;
};

export type UnFollowInput = {
  userId: string;
  followeeId: string;
};
