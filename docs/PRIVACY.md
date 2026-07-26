# Privacy

Northstar AI is local-first by design.

## What is stored locally

- Tasks, schedule blocks, focus sessions, and inbox captures in SQLite.
- User preferences in SQLite.
- Optional calendar events imported with explicit permission.

## What leaves the device

Nothing by default. There are no analytics, advertising, or tracking SDKs.

## Future remote AI

If a remote AI provider is enabled, text is sent to a server-side endpoint chosen by you. No privileged API keys are kept in the app.

## Permissions

- Calendar: read-only by default. No writes without explicit confirmation.
- Notifications: opt-in, cancellable when tasks move or complete.

## Data deletion

Settings includes **Reset all local data** to wipe the SQLite database.
