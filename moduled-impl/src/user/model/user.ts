export type User = {
  id: string;
  email: string;
  profile: Profile;
  createdAt: Date;
};

type Profile = {
  username: string;
  bio: string;
  avatar: string;
  website: string;
};
