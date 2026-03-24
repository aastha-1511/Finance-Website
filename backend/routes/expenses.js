import express from 'express';
import Expense from '../models/Expense.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// @route   GET /api/expenses
// @desc    Get user expenses
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/expenses
// @desc    Add new expense
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { title, amount, category, date } = req.body;
        const expense = await Expense.create({
            user: req.user._id,
            title,
            amount,
            category,
            date: date || Date.now()
        });
        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        if (expense.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

        await expense.deleteOne();
        res.json({ message: 'Expense removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
