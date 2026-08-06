CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roundId` int NOT NULL,
	`homeTeam` varchar(100) NOT NULL,
	`awayTeam` varchar(100) NOT NULL,
	`result` enum('1','X','2'),
	`matchOrder` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`userId` int NOT NULL,
	`prediction` enum('1','X','2') NOT NULL,
	`isCorrect` enum('true','false','pending') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roundNumber` int NOT NULL,
	`prize` text,
	`bettingDeadline` timestamp NOT NULL,
	`winnerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rounds_id` PRIMARY KEY(`id`),
	CONSTRAINT `rounds_roundNumber_unique` UNIQUE(`roundNumber`)
);
