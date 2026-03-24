import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    symbol: String,
    type: { type: String, enum: ['BUY', 'SELL'] },
    quantity: Number,
    price: Number,
    date: { type: Date, default: Date.now }
});

const positionSchema = new mongoose.Schema({
    symbol: String,
    quantity: Number,
    averagePrice: Number
});

const portfolioSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0 },  // available funds in ₹
    positions: [positionSchema],
    orders: [orderSchema]
}, { timestamps: true });

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
export default Portfolio;
