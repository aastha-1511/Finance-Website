/**
 * NSE Market Hours Validator — IST (UTC+5:30)
 * Market open: Mon–Fri, 09:15–15:30 IST, excluding NSE holidays
 */

// 2026 NSE Equity Market Holidays
const NSE_HOLIDAYS_2026 = new Set([
    '2026-01-15', // Municipal Corporation Election — Maharashtra
    '2026-01-26', // Republic Day
    '2026-03-03', // Holi
    '2026-03-26', // Shri Ram Navami
    '2026-03-31', // Shri Mahavir Jayanti
    '2026-04-03', // Good Friday
    '2026-04-14', // Dr. Baba Saheb Ambedkar Jayanti
    '2026-05-01', // Maharashtra Day
    '2026-05-28', // Bakri Id
    '2026-06-26', // Muharram
    '2026-09-14', // Ganesh Chaturthi
    '2026-10-02', // Mahatma Gandhi Jayanti
    '2026-10-20', // Dussehra
    '2026-11-10', // Diwali–Balipratipada
    '2026-11-24', // Prakash Gurpurb Sri Guru Nanak Dev
    '2026-12-25', // Christmas
]);

/**
 * Returns { isOpen: bool, reason: string }
 * All checks done in IST (UTC+5:30).
 */
export function checkMarketOpen() {
    // Get current IST time
    const nowUTC = new Date();
    // IST = UTC + 5h30m
    const istOffset = 5 * 60 + 30; // minutes
    const istMs = nowUTC.getTime() + istOffset * 60 * 1000;
    const ist = new Date(istMs);

    const dayOfWeek = ist.getUTCDay(); // 0=Sun, 1=Mon…6=Sat
    const hours = ist.getUTCHours();
    const minutes = ist.getUTCMinutes();

    // Build YYYY-MM-DD string in IST
    const year = ist.getUTCFullYear();
    const month = String(ist.getUTCMonth() + 1).padStart(2, '0');
    const day = String(ist.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { isOpen: false, reason: 'Market is closed on weekends. Trading hours are Mon–Fri, 9:15 AM – 3:30 PM IST.' };
    }

    // Holiday check
    if (NSE_HOLIDAYS_2026.has(dateStr)) {
        return { isOpen: false, reason: `Market is closed today (NSE Holiday). Trading resumes on the next business day.` };
    }

    // Time check — market opens 9:15, closes 15:30
    const totalMinutes = hours * 60 + minutes;
    const openMinutes = 9 * 60 + 15;   // 09:15
    const closeMinutes = 15 * 60 + 30;  // 15:30

    if (totalMinutes < openMinutes) {
        return { isOpen: false, reason: `Market opens at 9:15 AM IST. Current IST time: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}.` };
    }
    if (totalMinutes >= closeMinutes) {
        return { isOpen: false, reason: `Market closed at 3:30 PM IST. Trading resumes next business day at 9:15 AM IST.` };
    }

    return { isOpen: true, reason: 'Market is open.' };
}
