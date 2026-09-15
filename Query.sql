/* =============================================================================
    GYM ADMISSION MANAGEMENT SYSTEM (GAMS) - CONSOLIDATED SQL SCRIPT
   ============================================================================= */

-- 1. REVENUE REPORTING
SELECT 
    p.id, 
    p.ref_no,
    m.name AS member_name, 
    m.email AS member_email,
    m.contact_number AS member_phone,
    m.role AS member_role,
    p.amount, 
    p.payment_method, 
    p.status, 
    p.payment_date 
FROM payments p
LEFT JOIN members m ON p.member_id = m.id
WHERE p.status IN ('Paid', 'Completed', 'Void') 
AND p.payment_date BETWEEN DATE_SUB(?, INTERVAL 7 DAY) AND DATE_ADD(?, INTERVAL 1 DAY)
ORDER BY p.payment_date DESC;

-- 2. DASHBOARD ANALYTICS
SELECT SUM(amount) AS total 
FROM payments 
WHERE status IN ('Paid', 'Completed') 
AND YEAR(payment_date) = ?;

-- 3. MEMBERSHIP DISTRIBUTION
SELECT role AS name, COUNT(*) AS value 
FROM members 
GROUP BY role;

-- 4. REGISTRATION TRENDS
SELECT DATE_FORMAT(joined, '%b') AS name, COUNT(*) AS members
FROM members 
WHERE joined >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
GROUP BY DATE_FORMAT(joined, '%Y-%m'), DATE_FORMAT(joined, '%b') 
ORDER BY DATE_FORMAT(joined, '%Y-%m') ASC;

-- 5. PAYMENT & ACTIVATION
-- Part A: Insert a new record into the transaction history
INSERT INTO payments (member_id, amount, payment_method, payment_date, status) 
VALUES (?, ?, ?, NOW(), 'Completed');

-- Part B: Immediately update the member's status to grant access
UPDATE members SET status = 'Active' WHERE id = ?;

-- 6. PROFILE MANAGEMENT
UPDATE members 
SET name = ?, email = ?, contact_number = ?, role = ? 
WHERE id = ?;

-- 7. RECENT TRANSACTIONS
SELECT p.id, p.ref_no, m.name AS member_name, p.amount, p.payment_method, p.payment_date, p.status 
FROM payments p
LEFT JOIN members m ON p.member_id = m.id
ORDER BY p.payment_date DESC;

-- 8. ACTIVITY FEED
SELECT message, type, image, created_at 
FROM activity_logs 
ORDER BY created_at DESC 
LIMIT 10;