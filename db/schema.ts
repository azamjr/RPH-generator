import { sqliteTable,text,integer,primaryKey } from 'drizzle-orm/sqlite-core';
export const records=sqliteTable('records',{userId:text('user_id').notNull(),id:text('id').notNull(),kind:text('kind').notNull(),content:text('content').notNull(),revision:integer('revision').notNull().default(1),updatedAt:text('updated_at').notNull()},t=>[primaryKey({columns:[t.userId,t.id]})]);
export const versions=sqliteTable('versions',{userId:text('user_id').notNull(),recordId:text('record_id').notNull(),revision:integer('revision').notNull(),content:text('content').notNull(),createdAt:text('created_at').notNull()},t=>[primaryKey({columns:[t.userId,t.recordId,t.revision]})]);
export const usage=sqliteTable('usage',{key:text('key').primaryKey(),count:integer('count').notNull().default(0)});
