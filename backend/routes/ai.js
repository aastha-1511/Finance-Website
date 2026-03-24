import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';

const router = express.Router();

// Lazily get the client so dotenv has already been loaded by index.js
const getGenAI = () => new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Auth middleware
const protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch { res.status(401).json({ message: 'Not authorized' }); }
};

// POST /api/ai/insights — chat with portfolio context
router.post('/insights', protect, async (req, res) => {
    try {
        const { message, portfolioSnapshot } = req.body;
        if (!message) return res.status(400).json({ message: 'Message required' });

        // Build portfolio context string
        let portfolioContext = '';
        if (portfolioSnapshot) {
            const { positions = [], orders = [], availableBalance = 0, livePrices = {} } = portfolioSnapshot;

            const totalInvested = positions.reduce((a, p) => a + p.averagePrice * p.quantity, 0);
            const totalCurrent = positions.reduce((a, p) => {
                const ltp = livePrices[p.symbol] || p.averagePrice;
                return a + ltp * p.quantity;
            }, 0);
            const totalPnl = totalCurrent - totalInvested;

            portfolioContext = `
## User's Current Portfolio:
- **Available Balance**: ₹${availableBalance.toLocaleString('en-IN')}
- **Total Invested**: ₹${totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
- **Current Portfolio Value**: ₹${totalCurrent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
- **Overall P&L**: ₹${totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${totalInvested ? ((totalPnl / totalInvested) * 100).toFixed(2) : 0}%)

### Open Positions (${positions.length}):
${positions.map(p => {
                const ltp = livePrices[p.symbol] || p.averagePrice;
                const invested = p.averagePrice * p.quantity;
                const current = ltp * p.quantity;
                const pnl = current - invested;
                return `- **${p.symbol.replace('.NS', '')}**: ${p.quantity} shares @ avg ₹${p.averagePrice.toFixed(2)}, LTP ₹${ltp.toFixed(2)}, P&L: ₹${pnl.toFixed(2)} (${invested ? ((pnl / invested) * 100).toFixed(2) : 0}%)`;
            }).join('\n') || '- No open positions'}

### Recent Orders (last 5):
${orders.slice(0, 5).map(o => `- ${o.type} ${o.quantity} ${o.symbol.replace('.NS', '')} @ ₹${o.price?.toFixed(2)}`).join('\n') || '- No recent orders'}
`;
        }

        const systemPrompt = `You are FinanceHub AI, an expert financial assistant embedded in a personal finance and stock trading dashboard for Indian markets. You provide insightful, actionable, and personalized investment advice based on the user's real portfolio data.

Guidelines:
- Be concise but thorough. Use bullet points and sections for clarity.
- Focus on Indian markets (NSE/BSE), use ₹ for currency.
- Provide specific insights based on actual portfolio data provided.
- Highlight risks, diversification issues, concentration risk.
- Suggest actionable next steps when relevant.
- Disclaimer at the end: "⚠️ This is AI-generated analysis for informational purposes only, not financial advice."
- Use emojis sparingly to highlight key points.
- If asked a general finance question not related to the portfolio, answer helpfully but briefly.

${portfolioContext}`;

        // Try models in preference order — fallback for different API key tiers
        const MODEL_CANDIDATES = ['gemini-2.0-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
        let text = '';
        let lastErr = null;
        for (const modelName of MODEL_CANDIDATES) {
            try {
                const model = getGenAI().getGenerativeModel({ model: modelName });
                const chat = model.startChat({
                    history: [],
                    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
                });
                const result = await chat.sendMessage(`${systemPrompt}\n\nUser question: ${message}`);
                text = result.response.text();
                break; // success
            } catch (e) {
                lastErr = e;
                const skip = e.message?.includes('not found') || e.message?.includes('404') || e.message?.includes('429') || e.message?.includes('Too Many Requests');
                if (!skip) throw e; // non-recoverable error, bail immediately
            }
        }
        if (!text) {
            const is429 = lastErr?.message?.includes('429') || lastErr?.message?.includes('Too Many Requests');
            if (is429) {
                return res.status(429).json({ message: 'quota_exceeded' });
            }
            throw lastErr;
        }

        res.json({ reply: text });
    } catch (error) {
        console.error('AI route error:', error.message);
        res.status(500).json({ message: 'AI service error: ' + error.message });
    }
});

export default router;
