# Follow-up History

Track every follow-up sent (email, LinkedIn, etc.) for active applications.
Cadence is enforced by `followup-cadence.mjs`:

| Status | First follow-up | Subsequent | Max attempts |
|--------|----------------|------------|--------------|
| Applied | 7 days after application | Every 7 days | 2 (then mark cold) |
| Responded | 1 day (urgent reply) | Every 3 days | No limit |
| Interview | 1 day after (thank-you) | Every 3 days | No limit |

`/career-ops followup` reads `data/applications.md` for status and computes
who is overdue. Reminders activate ONLY when an application's status moves
from `Evaluated` → `Applied` (with the application date logged in column 2).

| # | App# | Date | Company | Role | Channel | Contact | Notes |
|---|------|------|---------|------|---------|---------|-------|
