CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`isSuperAdmin` boolean NOT NULL DEFAULT false,
	`createdByUserId` int,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_email_unique` UNIQUE(`email`),
	CONSTRAINT `invitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
UPDATE `users` SET `name` = 'Utilizador antigo' WHERE `name` IS NULL OR TRIM(`name`) = '';--> statement-breakpoint
UPDATE `users` SET `email` = CONCAT('legacy-', `id`, '@local.invalid') WHERE `email` IS NULL OR TRIM(`email`) = '';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `passwordHash` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isSuperAdmin` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);
