USE gamsdb;

-- Create default preferences for existing, non-deleted members.
-- INSERT IGNORE preserves any preferences already saved by a member.
INSERT IGNORE INTO member_settings (member_id)
SELECT id
FROM members
WHERE status <> 'Deleted';

-- Verify the member and payment data used by the portal.
SELECT
    m.id,
    m.unique_id,
    m.first_name,
    m.last_name,
    m.email,
    m.role AS membership_plan,
    m.status AS membership_status,
    m.joined AS start_date,
    m.end_date,
    p.ref_no,
    p.amount,
    p.payment_method,
    p.payment_date,
    p.status AS payment_status
FROM members AS m
LEFT JOIN payments AS p ON p.member_id = m.id
WHERE m.email = 'thinkaboutzu@gmail.com'
  AND m.status <> 'Deleted'
ORDER BY p.payment_date DESC;
