-- Add completed_at column for tracking when issues are completed
ALTER TABLE `issues` ADD COLUMN `completed_at` text;
