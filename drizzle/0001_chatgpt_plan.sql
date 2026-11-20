CREATE TABLE `chatgpt_host` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chatgpt_oauth_state` (
	`state` text PRIMARY KEY NOT NULL,
	`nonce` text NOT NULL,
	`verifier` text NOT NULL,
	`redirect_uri` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chatgpt_accounts` (
	`subject` text NOT NULL,
	`client_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`id_token` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`scopes` text NOT NULL,
	`active` integer NOT NULL DEFAULT 1,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`subject`, `client_id`)
);
