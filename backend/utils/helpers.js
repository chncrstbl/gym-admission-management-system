import db from '../config/db.js';

// Helper: Get Date in MySQL Format (YYYY-MM-DD HH:MM:SS)
export const getLocalMySQLDate = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 19).replace('T', ' ');
};

// Helper: Log Activity to DB
export const logActivity = async (description, actionType, image = '') => {
    try {
        const timeSQL = getLocalMySQLDate(new Date());
        let finalImage = image;
        
        if (!finalImage) {
            if (actionType === 'delete') finalImage = "https://ui-avatars.com/api/?name=D&background=red&color=fff";
            else if (actionType === 'edit') finalImage = "https://ui-avatars.com/api/?name=E&background=blue&color=fff";
            else if (actionType === 'check-in') finalImage = "https://ui-avatars.com/api/?name=C&background=purple&color=fff";
            else finalImage = "https://ui-avatars.com/api/?name=A&background=green&color=fff";
        }

        await db.query(
            'INSERT INTO activity_logs (description, action_type, time, image) VALUES (?, ?, ?, ?)',
            [description, actionType, timeSQL, finalImage]
        );
    } catch (err) {
        console.error("Failed to log activity:", err);
    }
};

// DEMO: Payment Portal
export const openPaymentPortal = (method) => {
    if (['Cash', 'N/A', ''].includes(method)) return;

    const width = 480;
    const height = 640;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
        "", 
        "PaymentGateway", 
        `width=${width},height=${height},top=${top},left=${left}`
    );

    if (!popup) return;

    popup.document.write(`
        <html>
            <head>
                <title>Secure Payment - ${method}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f3f4f6; }
                    .loader { width: 50px; height: 50px; border: 5px solid #e5e7eb; border-top: 5px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
                    h2 { color: #1f2937; margin-bottom: 10px; }
                    p { color: #6b7280; font-size: 14px; }
                    .logo { font-weight: bold; font-size: 24px; color: #2563eb; margin-bottom: 40px; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            </head>
            <body>
                <div class="logo">DEMO GATEWAY</div>
                <div class="loader"></div>
                <h2>Redirecting to ${method}...</h2>
                <p>Please do not close this window.</p>
                <p style="margin-top: 50px; font-size: 12px; opacity: 0.7;">Simulation Mode: Closing in 5 seconds</p>
            </body>
        </html>
    `);

    setTimeout(() => {
        if (!popup.closed) popup.close();
    }, 5000);
};