import { SupabaseClient } from "@supabase/supabase-js";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  FollowInput,
  SignInInput,
  SignOutInput,
  SignUpInput,
  UnFollowInput,
} from "./user.service.types";
import { Auth } from "./model/auth";
import * as t from "db";
import { User } from "./model/user";
import { and, eq } from "drizzle-orm";
import { Follow } from "./model/follow";

export type UserService = {
  // query
  find(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  // command
  signUp: (input: SignUpInput) => Promise<Auth | AuthServiceError>;
  signIn: (input: SignInInput) => Promise<Auth | AuthServiceError>;
  signOut: (input: SignOutInput) => Promise<null | AuthServiceError>;
  follow: (input: FollowInput) => Promise<Follow | AuthServiceError>;
  unfollow: (input: UnFollowInput) => Promise<null | AuthServiceError>;
};

export class AuthServiceError extends Error {
  static {
    this.prototype.name = "AuthServiceError";
  }
}

type Dependency = {
  supabase: SupabaseClient;
  db: PostgresJsDatabase;
};

export const UserService = ({ supabase, db }: Dependency): UserService => ({
  // query
  find: async (id) => {
    const [user] = await db
      .select({
        id: t.User.id,
        email: t.User.email,
        profile: {
          username: t.UserProfile.username,
          bio: t.UserProfile.bio,
          avatar: t.UserProfile.avatar,
          website: t.UserProfile.website,
        },
        createdAt: t.User.createdAt,
      })
      .from(t.User)
      .innerJoin(t.UserProfile, eq(t.User.id, t.UserProfile.userId))
      .where(eq(t.User.id, id));
    return user ?? null;
  },
  findByEmail: async (email) => {
    const [user] = await db
      .select({
        id: t.User.id,
        email: t.User.email,
        profile: {
          username: t.UserProfile.username,
          bio: t.UserProfile.bio,
          avatar: t.UserProfile.avatar,
          website: t.UserProfile.website,
        },
        createdAt: t.User.createdAt,
      })
      .from(t.User)
      .innerJoin(t.UserProfile, eq(t.User.id, t.UserProfile.userId))
      .where(eq(t.User.email, email));
    return user ?? null;
  },
  // command
  signUp: async (input) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
    });
    if (error) {
      return new AuthServiceError(error.message, { cause: error });
    }
    if (!data.user || !data.session) {
      return new AuthServiceError("Failed to sign up");
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      profile: {
        username: input.username,
        bio: input.bio,
        avatar: input.avatar,
        website: input.website,
      },
      createdAt: new Date(data.user.created_at),
    };
    const auth: Auth = {
      user,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        tokenType: data.session.token_type,
        expiresIn: data.session.expires_in,
        expiresAt: new Date(data.session.expires_at ?? 0),
      },
    };

    await db.transaction(async (tx) => {
      await tx.insert(t.User).values({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      });
      await tx.insert(t.UserProfile).values({
        userId: user.id,
        ...user.profile,
      });
    });

    return auth;
  },
  signIn: async (input) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) {
      return new AuthServiceError("Failed to sign in", { cause: error });
    }
    const [user] = await db
      .select({
        id: t.User.id,
        email: t.User.email,
        profile: {
          username: t.UserProfile.username,
          bio: t.UserProfile.bio,
          avatar: t.UserProfile.avatar,
          website: t.UserProfile.website,
        },
        createdAt: t.User.createdAt,
      })
      .from(t.User)
      .innerJoin(t.UserProfile, eq(t.User.id, t.UserProfile.userId))
      .where(eq(t.User.id, data.user.id));

    const auth: Auth = {
      user: user!,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        tokenType: data.session.token_type,
        expiresIn: data.session.expires_in,
        expiresAt: new Date(data.session.expires_at ?? 0),
      },
    };

    return auth;
  },
  signOut: async (input) => {
    const { error } = await supabase.auth.admin.signOut(input.userId);
    if (error) {
      return new AuthServiceError("Failed to sign out", { cause: error });
    }

    return null;
  },
  follow: async (input) => {
    const [user] = await db
      .select({
        id: t.User.id,
      })
      .from(t.User)
      .where(eq(t.User.id, input.userId));
    if (!user) {
      return new AuthServiceError("User not found");
    }
    const [followee] = await db
      .select({
        id: t.User.id,
      })
      .from(t.User)
      .where(eq(t.User.id, input.followeeId));
    if (!followee) {
      return new AuthServiceError("Followee not found");
    }
    const [existingFollow] = await db
      .select({
        userId: t.Follow.userId,
        followeeId: t.Follow.followeeId,
        createdAt: t.Follow.createdAt,
      })
      .from(t.Follow)
      .where(
        and(
          eq(t.Follow.userId, input.userId),
          eq(t.Follow.followeeId, input.followeeId)
        )
      );
    if (existingFollow) {
      return existingFollow;
    }

    const follow: Follow = {
      userId: input.userId,
      followeeId: input.followeeId,
      createdAt: new Date(),
    };
    await db.insert(t.Follow).values(follow);

    return follow;
  },
  unfollow: async (input) => {
    const [follow] = await db
      .select({
        userId: t.Follow.userId,
        followeeId: t.Follow.followeeId,
        createdAt: t.Follow.createdAt,
      })
      .from(t.Follow)
      .where(
        and(
          eq(t.Follow.userId, input.userId),
          eq(t.Follow.followeeId, input.followeeId)
        )
      );
    if (!follow) {
      return null;
    }

    await db
      .delete(t.Follow)
      .where(
        and(
          eq(t.Follow.userId, follow.userId),
          eq(t.Follow.followeeId, follow.followeeId)
        )
      );

    return null;
  },
});
