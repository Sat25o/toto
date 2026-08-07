CREATE TABLE `roundWinners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roundId` int NOT NULL,
	`userId` int NOT NULL,
	`prizeShare` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roundWinners_id` PRIMARY KEY(`id`),
	CONSTRAINT `roundWinners_round_user_unique` UNIQUE(`roundId`,`userId`)
);
--> statement-breakpoint
ALTER TABLE `rounds` ADD `prizeAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `rounds` ADD `isSettled` boolean DEFAULT false NOT NULL;