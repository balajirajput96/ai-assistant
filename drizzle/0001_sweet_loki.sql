CREATE TABLE `connector_approval_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`connectorId` int NOT NULL,
	`actionName` varchar(160) NOT NULL,
	`actionSummary` text NOT NULL,
	`riskLevel` enum('low','medium','high','destructive','external_publish','financial') NOT NULL,
	`approvalStatus` enum('pending','approved','rejected','expired','cancelled') NOT NULL,
	`requestedScopesJson` text NOT NULL,
	`redactedArgumentsJson` text NOT NULL,
	`decisionNote` varchar(500),
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`decidedAt` timestamp,
	`expiresAt` timestamp,
	CONSTRAINT `connector_approval_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connector_audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`connectorId` int,
	`approvalId` int,
	`eventType` enum('connection_requested','connection_ready','connection_revoked','approval_requested','approval_approved','approval_rejected','execution_blocked','scope_denied') NOT NULL,
	`severity` enum('info','warning','security') NOT NULL,
	`detail` text NOT NULL,
	`metadataJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `connector_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connector_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`providerId` enum('github','google_workspace') NOT NULL,
	`providerLabel` varchar(80) NOT NULL,
	`connectionState` enum('disconnected','configuration_required','authorization_pending','connected','revoked','error') NOT NULL,
	`requestedScopesJson` text NOT NULL,
	`grantedScopesJson` text NOT NULL,
	`tokenReference` varchar(255),
	`lastValidatedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connector_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `connector_connections_user_provider_unique` UNIQUE(`userId`,`providerId`)
);
--> statement-breakpoint
ALTER TABLE `connector_approval_requests` ADD CONSTRAINT `con_appr_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `connector_approval_requests` ADD CONSTRAINT `con_appr_connection_fk` FOREIGN KEY (`connectorId`) REFERENCES `connector_connections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `connector_audit_events` ADD CONSTRAINT `con_audit_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `connector_audit_events` ADD CONSTRAINT `con_audit_connection_fk` FOREIGN KEY (`connectorId`) REFERENCES `connector_connections`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `connector_audit_events` ADD CONSTRAINT `con_audit_approval_fk` FOREIGN KEY (`approvalId`) REFERENCES `connector_approval_requests`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `connector_connections` ADD CONSTRAINT `con_connection_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `connector_approvals_user_status_idx` ON `connector_approval_requests` (`userId`,`approvalStatus`);--> statement-breakpoint
CREATE INDEX `connector_audit_events_user_created_idx` ON `connector_audit_events` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `connector_connections_user_idx` ON `connector_connections` (`userId`);
