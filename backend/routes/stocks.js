import express from 'express';
import YahooFinance from 'yahoo-finance2';
import { cacheGet, cacheSet } from '../utils/cache.js';

const router = express.Router();

// Pass a browser-like User-Agent so Yahoo Finance doesn't block server requests
const yf = new YahooFinance({
    fetchOptions: {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }
    }
});

const STOCK_LIST = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'SBIN.NS',
    'ICICIBANK.NS', 'ITC.NS', 'WIPRO.NS', 'BAJFINANCE.NS', 'AXISBANK.NS',
    'KOTAKBANK.NS', 'HINDUNILVR.NS', 'TITAN.NS', 'ADANIENT.NS', 'ONGC.NS'
];

// Cache TTLs (seconds)
const TTL_PRICES = 30;
const TTL_QUOTE = 30;
const TTL_HISTORY = 300;

// GET live prices for multiple symbols
router.get('/prices', async (req, res) => {
    const symbols = req.query.symbols
        ? req.query.symbols.split(',')
        : STOCK_LIST;

    const cacheKey = `prices:${symbols.join(',')}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        const results = await Promise.allSettled(
            symbols.map(async (sym) => {
                const q = await yf.quote(sym, {}, { validateResult: false });
                return {
                    symbol: sym,
                    name: q.shortName || sym.replace('.NS', ''),
                    price: q.regularMarketPrice || 0,
                    change: q.regularMarketChange || 0,
                    changePercent: q.regularMarketChangePercent || 0,
                    open: q.regularMarketOpen || 0,
                    high: q.regularMarketDayHigh || 0,
                    low: q.regularMarketDayLow || 0,
                    volume: q.regularMarketVolume || 0
                };
            })
        );

        // Log failures for debugging in production
        results.forEach((r, i) => {
            if (r.status === 'rejected') {
                console.error(`❌ Failed to fetch ${symbols[i]}:`, r.reason?.message);
            }
        });

        const prices = results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);

        if (prices.length > 0) await cacheSet(cacheKey, prices, TTL_PRICES);
        res.json(prices);
    } catch (error) {
        console.error('Prices error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// GET historical OHLC for candlestick charts
router.get('/:symbol/history', async (req, res) => {
    const { symbol } = req.params;
    const interval = req.query.interval || '1d';
    const range = req.query.range || '3mo';

    const cacheKey = `history:${symbol}:${range}:${interval}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        // v3 removed 'range' param — must use period1 (start date)
        const period1 = new Date();
        switch (range) {
            case '1mo': period1.setMonth(period1.getMonth() - 1); break;
            case '3mo': period1.setMonth(period1.getMonth() - 3); break;
            case '6mo': period1.setMonth(period1.getMonth() - 6); break;
            case '1y': period1.setFullYear(period1.getFullYear() - 1); break;
            case '2y': period1.setFullYear(period1.getFullYear() - 2); break;
            default: period1.setMonth(period1.getMonth() - 3);
        }

        const result = await yf.chart(
            symbol,
            { period1: period1.toISOString().split('T')[0], interval },
            { validateResult: false }
        );

        if (!result?.quotes?.length) {
            return res.json({ quotes: [] });
        }

        const quotes = result.quotes
            .filter(q => q.open != null && q.high != null && q.low != null && q.close != null)
            .map(q => ({
                date: q.date,
                open: parseFloat(q.open.toFixed(2)),
                high: parseFloat(q.high.toFixed(2)),
                low: parseFloat(q.low.toFixed(2)),
                close: parseFloat(q.close.toFixed(2)),
                volume: q.volume || 0
            }));

        const payload = { quotes, symbol };
        await cacheSet(cacheKey, payload, TTL_HISTORY);
        res.json(payload);
    } catch (error) {
        console.error('History error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// GET single stock live price
router.get('/quote/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const cacheKey = `quote:${symbol}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        const q = await yf.quote(symbol, {}, { validateResult: false });
        const payload = {
            symbol,
            price: q.regularMarketPrice,
            changePercent: q.regularMarketChangePercent
        };
        await cacheSet(cacheKey, payload, TTL_QUOTE);
        res.json(payload);
    } catch (error) {
        console.error('Quote error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

export default router;
