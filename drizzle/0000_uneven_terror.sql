CREATE TABLE `records` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`kind` text NOT NULL,
	`content` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`)
);
--> statement-breakpoint
CREATE TABLE `usage` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `versions` (
	`user_id` text NOT NULL,
	`record_id` text NOT NULL,
	`revision` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `record_id`, `revision`)
);
