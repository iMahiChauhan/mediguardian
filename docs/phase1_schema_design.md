# MediGuardian 4.0 Phase 1 Schema Design

Role acknowledged: Lead Architect and Principal Software Engineer for MediGuardian 4.0. This design is modular, backward compatible, additive-only, RBAC-first, and prepared for PostgreSQL plus MongoDB in a live production deployment.

## PostgreSQL Relational Schema

PostgreSQL remains the system of record for identity, RBAC, appointment scheduling, and EHR metadata. PII/PHI fields are stored in `bytea` columns encrypted with `pgcrypto` AES-256 compatible symmetric encryption. Queryable sensitive values use deterministic SHA-256 lookup hashes, never plaintext matching.

### users

Existing columns are preserved for live compatibility: `id`, `username`, `email`, `hashed_password`, `is_active`, `created_at`.

New additive columns:

- `updated_at timestamptz null`
- `display_name_encrypted bytea null`
- `phone_encrypted bytea null`
- `email_encrypted bytea null`
- `email_lookup_hash varchar(64) null`
- `mfa_enabled boolean not null default false`
- `last_login_at timestamptz null`

Indexes:

- `users.username unique`
- `users.email unique`, retained until the auth flow migrates to encrypted email lookup
- `ix_users_email_lookup_hash`

### roles

- `id serial primary key`
- `name varchar(80) not null unique`
- `description text null`
- `is_system boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz null`

Initial system roles: `patient`, `clinician`, `care_coordinator`, `admin`, `auditor`.

### permissions

- `id serial primary key`
- `resource varchar(80) not null`
- `action varchar(80) not null`
- `description text null`
- `created_at timestamptz not null default now()`
- `unique(resource, action)`

Recommended resources: `users`, `roles`, `ehr`, `appointments`, `ai_chat`, `audit`.

### user_roles

- `id serial primary key`
- `user_id integer not null references users(id)`
- `role_id integer not null references roles(id)`
- `assigned_by_user_id integer null references users(id)`
- `assigned_at timestamptz not null default now()`
- `expires_at timestamptz null`
- `unique(user_id, role_id)`

Indexes:

- `ix_user_roles_user_id`
- `ix_user_roles_role_id`

### role_permissions

- `id serial primary key`
- `role_id integer not null references roles(id)`
- `permission_id integer not null references permissions(id)`
- `created_at timestamptz not null default now()`
- `unique(role_id, permission_id)`

### ehr_records

Relational EHR rows hold stable metadata and encrypted summaries. Large clinical JSON and longitudinal snapshots live in MongoDB.

- `id serial primary key`
- `patient_user_id integer not null references users(id)`
- `created_by_user_id integer not null references users(id)`
- `record_type varchar(80) not null`
- `status varchar(32) not null default 'active'`
- `title_encrypted bytea not null`
- `clinical_summary_encrypted bytea null`
- `effective_at timestamptz not null`
- `source_system varchar(80) null`
- `mongo_snapshot_id varchar(64) null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz null`

Indexes:

- `ix_ehr_records_patient_effective(patient_user_id, effective_at)`
- `ix_ehr_records_record_type`
- `ix_ehr_records_status`

### appointments

- `id serial primary key`
- `patient_user_id integer not null references users(id)`
- `clinician_user_id integer null references users(id)`
- `created_by_user_id integer not null references users(id)`
- `status varchar(32) not null default 'scheduled'`
- `appointment_type varchar(80) not null default 'consultation'`
- `reason_encrypted bytea null`
- `location_encrypted bytea null`
- `starts_at timestamptz not null`
- `ends_at timestamptz not null`
- `reminder_minutes smallint not null default 30`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz null`

Indexes:

- `ix_appointments_patient_starts(patient_user_id, starts_at)`
- `ix_appointments_clinician_starts(clinician_user_id, starts_at)`
- `ix_appointments_status`

## Encryption Strategy

Use PostgreSQL `pgcrypto` with an application-managed key from `PHI_ENCRYPTION_KEY`.

Example write expression:

```sql
pgp_sym_encrypt(:plaintext_value, current_setting('app.phi_encryption_key'), 'cipher-algo=aes256')
```

Example read expression:

```sql
pgp_sym_decrypt(encrypted_column, current_setting('app.phi_encryption_key'))
```

Lookup fields:

```sql
encode(digest(lower(trim(:email)) || :lookup_pepper, 'sha256'), 'hex')
```

Production checklist:

- Add `PHI_ENCRYPTION_KEY` and `PHI_LOOKUP_PEPPER` to backend runtime secrets.
- Set `app.phi_encryption_key` per database session before encrypted queries.
- Rotate keys with a forward migration that re-encrypts into new columns before cutting reads over.
- Never log plaintext PII/PHI or encryption keys.

## MongoDB Collections

MongoDB stores unstructured and fast-evolving documents. PostgreSQL stores the authorization and ownership boundary for every MongoDB reference.

### ai_chat_sessions

```json
{
  "_id": "ObjectId",
  "patientUserId": 123,
  "createdByUserId": 123,
  "status": "active",
  "channel": "web",
  "startedAt": "2026-07-02T00:00:00Z",
  "endedAt": null,
  "metadata": {
    "locale": "en-US",
    "clientVersion": "4.0.0"
  }
}
```

Indexes:

- `{ "patientUserId": 1, "startedAt": -1 }`
- `{ "status": 1, "startedAt": -1 }`

### ai_chat_messages

```json
{
  "_id": "ObjectId",
  "sessionId": "ObjectId",
  "patientUserId": 123,
  "sender": "patient",
  "messageCiphertext": "base64",
  "model": "triage-v1",
  "riskSignals": {
    "severity": "LOW",
    "requiresEmergencyEscalation": false
  },
  "createdAt": "2026-07-02T00:01:00Z"
}
```

Indexes:

- `{ "sessionId": 1, "createdAt": 1 }`
- `{ "patientUserId": 1, "createdAt": -1 }`

### ehr_longitudinal_snapshots

```json
{
  "_id": "ObjectId",
  "ehrRecordId": 456,
  "patientUserId": 123,
  "schemaVersion": 1,
  "snapshotCiphertext": "base64",
  "sourceSystem": "mediguardian",
  "clinicalDateRange": {
    "from": "2026-01-01T00:00:00Z",
    "to": "2026-07-02T00:00:00Z"
  },
  "createdAt": "2026-07-02T00:00:00Z"
}
```

Indexes:

- `{ "patientUserId": 1, "createdAt": -1 }`
- `{ "ehrRecordId": 1 }`
- `{ "schemaVersion": 1 }`

## Non-Destructive Migration Strategy

1. Deploy schema-only migration `20260702_0001_phase1_foundation_schema.py`.
2. Keep the current auth service reading `users.email` and `users.username`.
3. Backfill `email_lookup_hash` and `email_encrypted` in a separate batched job after `PHI_ENCRYPTION_KEY` and `PHI_LOOKUP_PEPPER` are deployed.
4. Add RBAC seed data in a separate additive migration or idempotent deployment task.
5. Cut API endpoints over to RBAC guards one service at a time.
6. After encrypted reads are verified, stop writing new PII to plaintext compatibility columns. Do not drop old columns in Phase 1.

Production checklist:

- Run `cd backend && alembic upgrade head` against staging first.
- Confirm `CREATE EXTENSION pgcrypto` is allowed for the production database role.
- Run a preflight query for duplicate usernames and emails before backfill.
- Verify existing `/api/auth/register`, `/api/auth/login`, and `/api/auth/me` still pass.
- Add automated RBAC tests before enabling write APIs for EHR and appointments.
