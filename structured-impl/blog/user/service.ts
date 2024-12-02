import { User } from "./model/user.ts";

export type UserService = {
  create: (name: string) => User;
  update: (id: string, name: string) => User;
  delete: (id: string) => void;
  find: (id: string) => User | null;
};
