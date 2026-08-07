CREATE TABLE `adminMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`content` text NOT NULL,
	`isPinned` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leagueRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content` text NOT NULL,
	`displayOrder` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leagueRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
INSERT INTO `leagueRules` (`content`, `displayOrder`, `isActive`) VALUES
('Este ano aplicam-se regras mais rigorosas, por respeito a todos e ao bom funcionamento da administração.', 1, true),
('Quem não pagar a jornada não participa nessa jornada.', 2, true),
('Após 3 jornadas consecutivas sem pagamento, o participante é removido do grupo. Os palpites só são aceites até 6 horas antes do primeiro jogo.', 3, true),
('Quem escolhe os jogos semanais deve fazê-lo com uma semana de antecedência. Caso contrário, essa responsabilidade passa para a pessoa seguinte.', 4, true),
('Todas as mensagens não relacionadas com o propósito da liga serão eliminadas.', 5, true);
