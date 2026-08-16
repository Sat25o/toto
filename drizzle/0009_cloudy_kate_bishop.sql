ALTER TABLE `matches` ADD `isPostponed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `rounds` ADD `carriedPrizeAmount` decimal(10,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `rounds` ADD `prizeRolledOver` boolean DEFAULT false NOT NULL;