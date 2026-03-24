import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true, enum: ['General', 'Market/SIP', 'Groceries', 'Utilities', 'Other'] },
    date: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
