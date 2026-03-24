import express from 'express';
import Portfolio from '../models/Portfolio.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import yahooFinance from 'yahoo-finance2';
import { checkMarketOpen } from '../utils/marketHours.js';

const router = express.Router();

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch {
            return res.status(401).json({ message: 'Not authorized' });
        }
    } else {
        return res.status(401).json({ message: 'No token' });
    }
};

const getOrCreatePortfolio = async (userId) => {
    let p = await Portfolio.findOne({ user: userId });
    if (!p) p = await Portfolio.create({ user: userId, positions: [], orders: [], balance: 0 });
    return p;
};

// GET full portfolio (positions + balance)
router.get('/', protect, async (req, res) => {
    try {
        const portfolio = await getOrCreatePortfolio(req.user._id);
        res.json(portfolio);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST add funds (dummy)
router.post('/funds/add', protect, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
        const portfolio = await getOrCreatePortfolio(req.user._id);
        portfolio.balance += Number(amount);
        await portfolio.save();
        res.json({ balance: portfolio.balance, message: `₹${amount} added successfully` });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST withdraw funds
router.post('/funds/withdraw', protect, async (req, res) => {
    try {
        const { amount } = req.body;
        const portfolio = await getOrCreatePortfolio(req.user._id);
        if (amount > portfolio.balance) return res.status(400).json({ message: 'Insufficient balance' });
        portfolio.balance -= Number(amount);
        await portfolio.save();
        res.json({ balance: portfolio.balance });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST buy stock (checks balance)
router.post('/buy', protect, async (req, res) => {
    try {
        // ── Market hours check ──
        const market = checkMarketOpen();
        if (!market.isOpen) return res.status(403).json({ message: market.reason, marketClosed: true });

        const { symbol, quantity, price } = req.body;
        const totalCost = quantity * price;
        const portfolio = await getOrCreatePortfolio(req.user._id);

        if (portfolio.balance < totalCost) {
            return res.status(400).json({
                message: `Insufficient funds. Need ₹${totalCost.toFixed(2)}, you have ₹${portfolio.balance.toFixed(2)}.`
            });
        }

        // Deduct balance
        portfolio.balance -= totalCost;

        // Update position
        const posIdx = portfolio.positions.findIndex(p => p.symbol === symbol);
        if (posIdx > -1) {
            const ex = portfolio.positions[posIdx];
            const newQty = ex.quantity + quantity;
            ex.averagePrice = ((ex.quantity * ex.averagePrice) + totalCost) / newQty;
            ex.quantity = newQty;
        } else {
            portfolio.positions.push({ symbol, quantity, averagePrice: price });
        }

        // Log order
        portfolio.orders.push({ symbol, type: 'BUY', quantity, price });
        await portfolio.save();
        res.json(portfolio);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST sell stock (credits balance)
router.post('/sell', protect, async (req, res) => {
    try {
        // ── Market hours check ──
        const market = checkMarketOpen();
        if (!market.isOpen) return res.status(403).json({ message: market.reason, marketClosed: true });

        const { symbol, quantity, price } = req.body;
        const portfolio = await getOrCreatePortfolio(req.user._id);

        const posIdx = portfolio.positions.findIndex(p => p.symbol === symbol);
        if (posIdx === -1) return res.status(400).json({ message: 'Stock not in portfolio' });

        const ex = portfolio.positions[posIdx];
        if (ex.quantity < quantity) return res.status(400).json({ message: 'Insufficient quantity' });

        ex.quantity -= quantity;
        if (ex.quantity === 0) portfolio.positions.splice(posIdx, 1);

        // Credit balance
        portfolio.balance += quantity * price;

        // Log order
        portfolio.orders.push({ symbol, type: 'SELL', quantity, price });
        await portfolio.save();
        res.json(portfolio);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

export default router;
