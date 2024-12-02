import { AuthToken } from "./model/authToken.ts";
import { UserAuth } from "./model/userAuth.ts";

export type AuthService = {
  create: (id: string, email: string, password: string) => AuthToken;
  login: (email: string, password: string) => AuthToken;
  logout: (token: AuthToken) => void;
  checkToken: (token: AuthToken) => UserAuth;
  checkEmailExists: (email: string) => boolean;
};
