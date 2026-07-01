"""phase 1 auth rbac ehr appointment foundation

Revision ID: 20260702_0001
Revises:
Create Date: 2026-07-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "20260702_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _is_postgres() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def upgrade() -> None:
    inspector = inspect(op.get_bind())
    existing_tables = set(inspector.get_table_names())

    if _is_postgres():
        op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    if "users" not in existing_tables:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("username", sa.String(), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("hashed_password", sa.String(), nullable=False),
            sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )
        op.create_index("ix_users_username", "users", ["username"], unique=True)
        op.create_index("ix_users_email", "users", ["email"], unique=True)

    user_columns = {column["name"] for column in inspect(op.get_bind()).get_columns("users")}
    with op.batch_alter_table("users") as batch_op:
        if "updated_at" not in user_columns:
            batch_op.add_column(sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))
        if "display_name_encrypted" not in user_columns:
            batch_op.add_column(sa.Column("display_name_encrypted", sa.LargeBinary(), nullable=True))
        if "phone_encrypted" not in user_columns:
            batch_op.add_column(sa.Column("phone_encrypted", sa.LargeBinary(), nullable=True))
        if "email_encrypted" not in user_columns:
            batch_op.add_column(sa.Column("email_encrypted", sa.LargeBinary(), nullable=True))
        if "email_lookup_hash" not in user_columns:
            batch_op.add_column(sa.Column("email_lookup_hash", sa.String(length=64), nullable=True))
        if "mfa_enabled" not in user_columns:
            batch_op.add_column(sa.Column("mfa_enabled", sa.Boolean(), server_default=sa.false(), nullable=False))
        if "last_login_at" not in user_columns:
            batch_op.add_column(sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))

    user_indexes = {index["name"] for index in inspect(op.get_bind()).get_indexes("users")}
    if "ix_users_email_lookup_hash" not in user_indexes:
        op.create_index("ix_users_email_lookup_hash", "users", ["email_lookup_hash"], unique=False)

    if "symptom_history" not in existing_tables:
        op.create_table(
            "symptom_history",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("symptoms_text", sa.Text(), nullable=False),
            sa.Column("top_condition_name", sa.String(), nullable=False),
            sa.Column("severity", sa.String(), nullable=False),
            sa.Column("is_emergency", sa.Boolean(), server_default=sa.false(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )
        op.create_index("ix_symptom_history_id", "symptom_history", ["id"], unique=False)

    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_system", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_roles_name", "roles", ["name"], unique=True)

    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("resource", sa.String(length=80), nullable=False),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("resource", "action", name="uq_permissions_resource_action"),
    )
    op.create_index("ix_permissions_resource_action", "permissions", ["resource", "action"], unique=False)

    op.create_table(
        "user_roles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("role_id", sa.Integer(), sa.ForeignKey("roles.id"), nullable=False),
        sa.Column("assigned_by_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "role_id", name="uq_user_roles_user_role"),
    )
    op.create_index("ix_user_roles_user_id", "user_roles", ["user_id"], unique=False)
    op.create_index("ix_user_roles_role_id", "user_roles", ["role_id"], unique=False)

    op.create_table(
        "role_permissions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("role_id", sa.Integer(), sa.ForeignKey("roles.id"), nullable=False),
        sa.Column("permission_id", sa.Integer(), sa.ForeignKey("permissions.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("role_id", "permission_id", name="uq_role_permissions_role_permission"),
    )
    op.create_index("ix_role_permissions_role_id", "role_permissions", ["role_id"], unique=False)
    op.create_index("ix_role_permissions_permission_id", "role_permissions", ["permission_id"], unique=False)

    op.create_table(
        "ehr_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("patient_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_by_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("record_type", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="active", nullable=False),
        sa.Column("title_encrypted", sa.LargeBinary(), nullable=False),
        sa.Column("clinical_summary_encrypted", sa.LargeBinary(), nullable=True),
        sa.Column("effective_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("source_system", sa.String(length=80), nullable=True),
        sa.Column("mongo_snapshot_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_ehr_records_patient_effective", "ehr_records", ["patient_user_id", "effective_at"], unique=False)
    op.create_index("ix_ehr_records_record_type", "ehr_records", ["record_type"], unique=False)
    op.create_index("ix_ehr_records_status", "ehr_records", ["status"], unique=False)

    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("patient_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("clinician_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_by_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="scheduled", nullable=False),
        sa.Column("appointment_type", sa.String(length=80), server_default="consultation", nullable=False),
        sa.Column("reason_encrypted", sa.LargeBinary(), nullable=True),
        sa.Column("location_encrypted", sa.LargeBinary(), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reminder_minutes", sa.SmallInteger(), server_default="30", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_appointments_patient_starts", "appointments", ["patient_user_id", "starts_at"], unique=False)
    op.create_index("ix_appointments_clinician_starts", "appointments", ["clinician_user_id", "starts_at"], unique=False)
    op.create_index("ix_appointments_status", "appointments", ["status"], unique=False)


def downgrade() -> None:
    # Production rollback should use a forward corrective migration. This local
    # downgrade is intentionally conservative and never drops existing users data.
    op.drop_index("ix_appointments_status", table_name="appointments")
    op.drop_index("ix_appointments_clinician_starts", table_name="appointments")
    op.drop_index("ix_appointments_patient_starts", table_name="appointments")
    op.drop_table("appointments")
    op.drop_index("ix_ehr_records_status", table_name="ehr_records")
    op.drop_index("ix_ehr_records_record_type", table_name="ehr_records")
    op.drop_index("ix_ehr_records_patient_effective", table_name="ehr_records")
    op.drop_table("ehr_records")
    op.drop_index("ix_role_permissions_permission_id", table_name="role_permissions")
    op.drop_index("ix_role_permissions_role_id", table_name="role_permissions")
    op.drop_table("role_permissions")
    op.drop_index("ix_user_roles_role_id", table_name="user_roles")
    op.drop_index("ix_user_roles_user_id", table_name="user_roles")
    op.drop_table("user_roles")
    op.drop_index("ix_permissions_resource_action", table_name="permissions")
    op.drop_table("permissions")
    op.drop_index("ix_roles_name", table_name="roles")
    op.drop_table("roles")
    op.drop_index("ix_users_email_lookup_hash", table_name="users")
