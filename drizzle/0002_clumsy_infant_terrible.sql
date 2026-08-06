CREATE TABLE `emailNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roundId` int,
	`type` enum('round_created','deadline_reminder','results_published') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`sent` enum('true','false') NOT NULL DEFAULT 'false',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailNotifications_id` PRIMARY KEY(`id`)
);
