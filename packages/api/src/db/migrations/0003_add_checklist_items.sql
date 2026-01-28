-- Add checklist_items table for sub-tasks/checklists on issues
CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for fast lookups by issue
CREATE INDEX IF NOT EXISTS idx_checklist_items_issue_id ON checklist_items(issue_id);
