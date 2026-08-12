CREATE TABLE `championsLeagueEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`edition` varchar(20) NOT NULL,
	`userId` int NOT NULL,
	`seed` int NOT NULL,
	`qualificationScore` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `championsLeagueEntries_id` PRIMARY KEY(`id`),
	CONSTRAINT `championsLeagueEntries_edition_user_unique` UNIQUE(`edition`,`userId`),
	CONSTRAINT `championsLeagueEntries_edition_seed_unique` UNIQUE(`edition`,`seed`)
);
--> statement-breakpoint
CREATE TABLE `championsLeagueMatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`edition` varchar(20) NOT NULL,
	`stage` enum('round_of_16','quarter_final','semi_final','final') NOT NULL,
	`roundNumber` int NOT NULL,
	`matchOrder` int NOT NULL,
	`homeEntryId` int,
	`awayEntryId` int,
	`winnerEntryId` int,
	`status` enum('pending','complete') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `championsLeagueMatches_id` PRIMARY KEY(`id`),
	CONSTRAINT `championsLeagueMatches_edition_stage_order_unique` UNIQUE(`edition`,`stage`,`matchOrder`)
);
