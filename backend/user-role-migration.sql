-- GAMS account-role migration
-- Run this script against the production database configured by Render's DB_NAME.
-- It adds/normalizes users.role if needed, assigns 'member' only where a matching
-- non-deleted member record proves the account is a member, and lets the owner
-- explicitly identify the administrator account below. It never promotes every
-- unmatched account to admin.

SET @gams_role_column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'role'
);

SET @gams_sql = IF(
    @gams_role_column_exists = 0,
    'ALTER TABLE users ADD COLUMN role VARCHAR(20) NULL DEFAULT NULL',
    'SELECT 1'
);
PREPARE gams_role_stmt FROM @gams_sql;
EXECUTE gams_role_stmt;
DEALLOCATE PREPARE gams_role_stmt;

-- Use a consistent string column so role values can be normalized to
-- the supported values: admin, staff, and member.
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NULL DEFAULT NULL;

-- Legacy membership plan labels or blank roles are repaired only when the
-- same email is present in the members table and the member is not deleted.
UPDATE users AS u
INNER JOIN members AS m
    ON LOWER(TRIM(m.email)) = LOWER(TRIM(u.email))
   AND COALESCE(m.status, '') <> 'Deleted'
SET u.role = 'member'
WHERE u.role IS NULL
   OR TRIM(u.role) = ''
   OR LOWER(TRIM(u.role)) NOT IN ('admin', 'staff', 'member');

-- IMPORTANT: Replace the placeholder with the exact email used for the
-- administrator login before running the next statement. The account will
-- be promoted only if it does not belong to a non-deleted member record.
SET @gams_admin_email = 'REPLACE_WITH_YOUR_ADMIN_EMAIL';

UPDATE users AS u
SET u.role = 'admin'
WHERE @gams_admin_email <> 'REPLACE_WITH_YOUR_ADMIN_EMAIL'
  AND LOWER(TRIM(u.email)) = LOWER(TRIM(@gams_admin_email))
  AND NOT EXISTS (
      SELECT 1
      FROM members AS m
      WHERE LOWER(TRIM(m.email)) = LOWER(TRIM(u.email))
        AND COALESCE(m.status, '') <> 'Deleted'
  );

-- Verify the resulting role counts without exposing account passwords.
SELECT role, COUNT(*) AS account_count
FROM users
GROUP BY role
ORDER BY role;
