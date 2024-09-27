import { User } from "./user";

export type Auth = {
  user: User;
  session: Session;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
};
