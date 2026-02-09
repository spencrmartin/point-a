CREATE TABLE `checklist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`issue_id` text NOT NULL,
	`title` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`issue_id` text NOT NULL,
	`author` text,
	`content` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `issue_dependencies` (
	`id` text PRIMARY KEY NOT NULL,
	`source_issue_id` text NOT NULL,
	`target_issue_id` text NOT NULL,
	`dependency_type` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`source_issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`project_id` text NOT NULL,
	`start_date` text,
	`end_date` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_cycles`("id", "name", "description", "project_id", "start_date", "end_date", "created_at", "updated_at") SELECT "id", "name", "description", "project_id", "start_date", "end_date", "created_at", "updated_at" FROM `cycles`;--> statement-breakpoint
DROP TABLE `cycles`;--> statement-breakpoint
ALTER TABLE `__new_cycles` RENAME TO `cycles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_issues` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'backlog' NOT NULL,
	`priority` text DEFAULT 'none' NOT NULL,
	`type` text DEFAULT 'task' NOT NULL,
	`assignee` text,
	`estimate` real,
	`due_date` text,
	`project_id` text NOT NULL,
	`cycle_id` text,
	`parent_id` text,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cycle_id`) REFERENCES `cycles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_issues`("id", "identifier", "title", "description", "status", "priority", "type", "assignee", "estimate", "due_date", "project_id", "cycle_id", "parent_id", "sort_order", "created_at", "updated_at", "completed_at") SELECT "id", "identifier", "title", "description", "status", "priority", "type", "assignee", "estimate", "due_date", "project_id", "cycle_id", "parent_id", "sort_order", "created_at", "updated_at", "completed_at" FROM `issues`;--> statement-breakpoint
DROP TABLE `issues`;--> statement-breakpoint
ALTER TABLE `__new_issues` RENAME TO `issues`;--> statement-breakpoint
CREATE UNIQUE INDEX `issues_identifier_unique` ON `issues` (`identifier`);--> statement-breakpoint
CREATE TABLE `__new_labels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#6b7280' NOT NULL,
	`project_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_labels`("id", "name", "color", "project_id", "created_at") SELECT "id", "name", "color", "project_id", "created_at" FROM `labels`;--> statement-breakpoint
DROP TABLE `labels`;--> statement-breakpoint
ALTER TABLE `__new_labels` RENAME TO `labels`;--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text DEFAULT '#6366f1' NOT NULL,
	`icon` text DEFAULT '📋' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_projects`("id", "key", "name", "description", "color", "icon", "created_at", "updated_at") SELECT "id", "key", "name", "description", "color", "icon", "created_at", "updated_at" FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_key_unique` ON `projects` (`key`);