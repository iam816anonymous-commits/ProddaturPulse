CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submitted_at TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Proddatur',
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  age TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  interests TEXT NOT NULL,
  timeline TEXT NOT NULL DEFAULT '',
  willingness_to_pay TEXT NOT NULL DEFAULT '',
  suggestion TEXT NOT NULL DEFAULT '',
  consent INTEGER NOT NULL CHECK (consent = 1),
  marketing_updates INTEGER NOT NULL DEFAULT 0 CHECK (marketing_updates IN (0,1))
);
CREATE INDEX IF NOT EXISTS idx_registrations_submitted_at ON registrations(submitted_at);
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone);
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
