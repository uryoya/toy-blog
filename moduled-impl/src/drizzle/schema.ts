import { relations } from 'drizzle-orm'
import { foreignKey, pgTable, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const User = pgTable('User', {
	id: text('id').notNull().primaryKey(),
	email: text('email').notNull().unique(),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull()
});

export const UserProfile = pgTable('UserProfile', {
	userId: text('userId').notNull().primaryKey(),
	username: text('username').notNull(),
	bio: text('bio').notNull(),
	avatar: text('avatar').notNull(),
	website: text('website').notNull()
}, (UserProfile) => ({
	'UserProfile_user_fkey': foreignKey({
		name: 'UserProfile_user_fkey',
		columns: [UserProfile.userId],
		foreignColumns: [User.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const Article = pgTable('Article', {
	id: text('id').notNull().primaryKey(),
	title: text('title').notNull(),
	content: text('content').notNull(),
	authorId: text('authorId').notNull()
}, (Article) => ({
	'Article_author_fkey': foreignKey({
		name: 'Article_author_fkey',
		columns: [Article.authorId],
		foreignColumns: [User.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const ArticleCreated = pgTable('ArticleCreated', {
	articleId: text('articleId').notNull().primaryKey(),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull()
}, (ArticleCreated) => ({
	'ArticleCreated_article_fkey': foreignKey({
		name: 'ArticleCreated_article_fkey',
		columns: [ArticleCreated.articleId],
		foreignColumns: [Article.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade')
}));

export const ArticleUpdated = pgTable('ArticleUpdated', {
	articleId: text('articleId').notNull(),
	updatedAt: timestamp('updatedAt', { precision: 3 }).notNull()
}, (ArticleUpdated) => ({
	'ArticleUpdated_article_fkey': foreignKey({
		name: 'ArticleUpdated_article_fkey',
		columns: [ArticleUpdated.articleId],
		foreignColumns: [Article.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'ArticleUpdated_articleId_updatedAt_unique_idx': uniqueIndex('ArticleUpdated_articleId_updatedAt_key')
		.on(ArticleUpdated.articleId, ArticleUpdated.updatedAt)
}));

export const Bookmark = pgTable('Bookmark', {
	userId: text('userId').notNull(),
	articleId: text('articleId').notNull(),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull()
}, (Bookmark) => ({
	'Bookmark_user_fkey': foreignKey({
		name: 'Bookmark_user_fkey',
		columns: [Bookmark.userId],
		foreignColumns: [User.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Bookmark_article_fkey': foreignKey({
		name: 'Bookmark_article_fkey',
		columns: [Bookmark.articleId],
		foreignColumns: [Article.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Bookmark_cpk': primaryKey({
		name: 'Bookmark_cpk',
		columns: [Bookmark.articleId, Bookmark.userId]
	})
}));

export const Follow = pgTable('Follow', {
	userId: text('userId').notNull(),
	followeeId: text('followeeId').notNull(),
	createdAt: timestamp('createdAt', { precision: 3 }).notNull()
}, (Follow) => ({
	'Follow_user_fkey': foreignKey({
		name: 'Follow_user_fkey',
		columns: [Follow.userId],
		foreignColumns: [User.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Follow_followee_fkey': foreignKey({
		name: 'Follow_followee_fkey',
		columns: [Follow.followeeId],
		foreignColumns: [User.id]
	})
		.onDelete('cascade')
		.onUpdate('cascade'),
	'Follow_cpk': primaryKey({
		name: 'Follow_cpk',
		columns: [Follow.userId, Follow.followeeId]
	})
}));

export const UserRelations = relations(User, ({ many }) => ({
	profile: many(UserProfile, {
		relationName: 'UserToUserProfile'
	}),
	articles: many(Article, {
		relationName: 'ArticleToUser'
	}),
	bookmarks: many(Bookmark, {
		relationName: 'BookmarkToUser'
	}),
	following: many(Follow, {
		relationName: 'FollowToUser'
	}),
	follower: many(Follow, {
		relationName: 'followee'
	})
}));

export const UserProfileRelations = relations(UserProfile, ({ one }) => ({
	user: one(User, {
		relationName: 'UserToUserProfile',
		fields: [UserProfile.userId],
		references: [User.id]
	})
}));

export const ArticleRelations = relations(Article, ({ one, many }) => ({
	author: one(User, {
		relationName: 'ArticleToUser',
		fields: [Article.authorId],
		references: [User.id]
	}),
	bookmarks: many(Bookmark, {
		relationName: 'ArticleToBookmark'
	}),
	createdAt: many(ArticleCreated, {
		relationName: 'ArticleToArticleCreated'
	}),
	updates: many(ArticleUpdated, {
		relationName: 'ArticleToArticleUpdated'
	})
}));

export const ArticleCreatedRelations = relations(ArticleCreated, ({ one }) => ({
	article: one(Article, {
		relationName: 'ArticleToArticleCreated',
		fields: [ArticleCreated.articleId],
		references: [Article.id]
	})
}));

export const ArticleUpdatedRelations = relations(ArticleUpdated, ({ one }) => ({
	article: one(Article, {
		relationName: 'ArticleToArticleUpdated',
		fields: [ArticleUpdated.articleId],
		references: [Article.id]
	})
}));

export const BookmarkRelations = relations(Bookmark, ({ one }) => ({
	user: one(User, {
		relationName: 'BookmarkToUser',
		fields: [Bookmark.userId],
		references: [User.id]
	}),
	article: one(Article, {
		relationName: 'ArticleToBookmark',
		fields: [Bookmark.articleId],
		references: [Article.id]
	})
}));

export const FollowRelations = relations(Follow, ({ one }) => ({
	user: one(User, {
		relationName: 'FollowToUser',
		fields: [Follow.userId],
		references: [User.id]
	}),
	followee: one(User, {
		relationName: 'followee',
		fields: [Follow.followeeId],
		references: [User.id]
	})
}));