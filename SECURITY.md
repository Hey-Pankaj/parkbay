# ParkBay security hardening

## Changes in this branch

- Public registration always creates a `driver`; it cannot assign `admin`.
- Login returns a signed, time-limited bearer token. Protected routes validate the signature and expiry and reload the user's current role from the database.
- Administrative endpoints require an authenticated administrator. Driver booking queries and profile operations are scoped to the authenticated account.
- Booking creation uses the authenticated account's name and phone rather than trusting client-supplied identity fields. Booking cancellation checks ownership; release is administrator-only.
- IoT telemetry/simulation and ANPR simulation require administrator authorization.
- The frontend sends the bearer token and no longer fabricates local login, bookings, or admin users when the API is unavailable.
- Login and registration are rate-limited. CORS is restricted to configured origins.
- Production requires a stable secret, explicit trusted origins, and configured database credentials. SQLite fallback is development-only.
- Default seeded passwords and hard-coded Compose secrets have been removed. A controlled administrator provisioning script is included.

## Required deployment configuration

### Docker Compose

1. Copy `.env.example` to `.env` in the repository root.
2. Replace every placeholder with unique, strong random values. Generate a secret with `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
3. Set `CORS_ORIGINS` to the exact public origin of the frontend (scheme + host, no path).
4. Set `INITIAL_ADMIN_EMAIL` and a unique `INITIAL_ADMIN_PASSWORD` (at least 16 characters) for a fresh database.
5. Start with `docker compose up --build`. Do not commit `.env`.

### Render

Configure the backend service's `DATABASE_URL`, `CORS_ORIGINS`, `INITIAL_ADMIN_EMAIL`, and `INITIAL_ADMIN_PASSWORD` in the Render dashboard. Render generates `SECRET_KEY`. Set CORS to the exact deployed frontend origin. Use a managed persistent database; do not use ephemeral SQLite in production.

### Existing databases

The old demo accounts may already exist in a deployed database. Changing the seed code does not delete or rotate existing rows. Before reopening the application, change or remove the old `admin@parkbay.com` / `admin123` and `driver@parkbay.com` / `password123` accounts. Create a new administrator using the interactive operator script from the backend directory:

```bash
python create_admin.py
```

The script prompts for the password without putting it in shell history. Do not reuse a demo password. Review existing bookings and user roles before deleting accounts referenced by historical data.

## Verification

Run the backend regression suite from `backend/`:

```bash
python -m unittest discover -s tests
```

Also verify manually against the deployed environment:
- unauthenticated admin calls return 401;
- authenticated driver admin calls return 403;
- an admin can access admin routes;
- registration with `role: "admin"` still creates a driver;
- drivers cannot query another user's bookings or profile;
- drivers cannot cancel another user's booking;
- tokens expire after `AUTH_TOKEN_TTL_SECONDS` (default 12 hours);
- frontend login and booking work with the real backend, and API downtime shows an error rather than demo data.

## Operational notes

- Tokens are bearer credentials; protect them in transit with HTTPS. They expire after 12 hours by default. Logging out clears the browser token; it does not revoke a previously copied token immediately.
- The default rate-limit store is process-local memory. For multi-worker or multi-instance production deployments, configure `RATELIMIT_STORAGE_URI` to a shared Redis-compatible store.
- Rotate any database or application secrets that were ever deployed or committed in the old Compose configuration.
- The ANPR route is now administrator-authenticated. A real gate controller should use a dedicated service identity and a narrowly scoped integration rather than a human admin token.
