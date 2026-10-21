import cron from 'node-cron';
import db from '../config/db.js';

export const updateExpiredMembers = async () => {
    try {
        const [result] = await db.query(`
            UPDATE members 
            SET status = 'Inactive' 
            WHERE end_date < CURDATE() AND status = 'Active'
        `);
        if (result.affectedRows > 0) {
            console.log(`[CRON] Auto-expired ${result.affectedRows} member(s).`);
        }
    } catch (err) {
        console.error('[CRON ERROR] Failed to auto-expire members:', err);
    }
};

export const initCronJobs = () => {
    updateExpiredMembers();

    cron.schedule('0 0 * * *', () => {
        console.log('[CRON] Running daily membership expiration check...');
        updateExpiredMembers();
    });
};