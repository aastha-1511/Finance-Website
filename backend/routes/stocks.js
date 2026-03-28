import express from 'express';
import { cacheGet, cacheSet } from '../utils/cache.js';

const router = express.Router();

const TD_KEY = process.env.TWELVE_DATA_API_KEY;
const TD_BASE = 'https://api.twelvedata.com';

// NSE stock list (without .NS suffix — Twelve Data uses SYMBOL:NSE format)
const STOCK_LIST = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN',
    'ICICIBANK', 'ITC', 'WIPRO', 'BAJFINANCE', 'AXISBANK',
    'KOTAKBANK', 'HINDUNILVR', 'TITAN', 'ADANIENT', 'ONGC'
];

// Cache TTLs (seconds)
const TTL_PRICES = 60;
const TTL_QUOTE  = 60;
const TTL_HISTORY = 300;

// Helpers: convert between formats
// RELIANCE.NS  →  RELIANCE:NSE
const toTD = (sym) => sym.replace('.NS', '') + ':NSE';
// RELIANCE:NSE  →  RELIANCE.NS
const fromTD = (sym) => sym.replace(':NSE', '.NS');

// ── GET /prices  (batch, used by Markets / Holdings / Positions) ─────────────
router.get('/prices', async (req, res) => {
    const inputSymbols = req.query.symbols
        ? req.query.symbols.split(',')
        : STOCK_LIST.map(s => s + '.NS');

    const cacheKey = `prices_td:${inputSymbols.join(',')}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        if (!TD_KEY) {
            console.error('TWELVE_DATA_API_KEY is not set');
            return res.status(500).json({ message: 'Stock API key not configured' });
        }

        // Twelve Data supports batch requests in one call
        const tdSymbols = inputSymbols.map(toTD).join(',');
        const url = `${TD_BASE}/quote?symbol=${encodeURIComponent(tdSymbols)}&apikey=${TD_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        // Twelve Data returns a flat object for single symbol, nested for multiple
        // Normalise to always be an array of [key, value] pairs
        let entries;
        if (data.symbol) {
            // Single symbol response
            entries = [[data.symbol + ':NSE', data]];
        } else {
            entries = Object.entries(data);
        }

        const prices = entries
            .filter(([, q]) => q && !q.code && q.close) // skip error objects
            .map(([key, q]) => ({
                symbol: fromTD(key),
                name: q.name || key.replace(':NSE', ''),
                price: parseFloat(q.close) || 0,
                change: parseFloat(q.change) || 0,
                changePercent: parseFloat(q.percent_change) || 0,
                open: parseFloat(q.open) || 0,
                high: parseFloat(q.high) || 0,
                low: parseFloat(q.low) || 0,
                volume: parseInt(q.volume) || 0,
            }));

        console.log(`✅ Fetched ${prices.length}/${inputSymbols.length} stock prices`);
        if (prices.length > 0) await cacheSet(cacheKey, prices, TTL_PRICES);
        res.json(prices);

    } catch (error) {
        console.error('Prices error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// ── GET /:symbol/history  (candlestick charts) ───────────────────────────────
router.get('/:symbol/history', async (req, res) => {
    const { symbol } = req.params;
    const interval = req.query.interval || '1day';
    const range = req.query.range || '3mo';

    const cacheKey = `history_td:${symbol}:${range}:${interval}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        if (!TD_KEY) return res.status(500).json({ message: 'Stock API key not configured' });

        // Map range to outputsize (number of data points)
        const outputSizeMap = { '1mo': 22, '3mo': 66, '6mo': 130, '1y': 252, '2y': 500 };
        const outputsize = outputSizeMap[range] || 66;

        // Twelve Data interval: '1day' for daily candlesticks
        const tdInterval = interval === '1d' ? '1day' : interval;
        const tdSymbol = toTD(symbol);

        const url = `${TD_BASE}/time_series?symbol=${encodeURIComponent(tdSymbol)}&interval=${tdInterval}&outputsize=${outputsize}&apikey=${TD_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.values?.length) {
            return res.json({ quotes: [] });
        }

        const quotes = data.values
            .map(q => ({
                date: new Date(q.datetime),
                open: parseFloat(q.open),
                high: parseFloat(q.high),
                low: parseFloat(q.low),
                close: parseFloat(q.close),
                volume: parseInt(q.volume) || 0,
            }))
            .reverse(); // Twelve Data returns newest first

        const payload = { quotes, symbol };
        await cacheSet(cacheKey, payload, TTL_HISTORY);
        res.json(payload);

    } catch (error) {
        console.error('History error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// ── GET /quote/:symbol  (single stock quick quote) ───────────────────────────
router.get('/quote/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const cacheKey = `quote_td:${symbol}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        if (!TD_KEY) return res.status(500).json({ message: 'Stock API key not configured' });

        const tdSymbol = toTD(symbol);
        const url = `${TD_BASE}/quote?symbol=${encodeURIComponent(tdSymbol)}&apikey=${TD_KEY}`;
        const response = await fetch(url);
        const q = await response.json();

        if (q.code) throw new Error(q.message || 'Twelve Data error');

        const payload = {
            symbol,
            price: parseFloat(q.close) || 0,
            changePercent: parseFloat(q.percent_change) || 0,
        };
        await cacheSet(cacheKey, payload, TTL_QUOTE);
        res.json(payload);

    } catch (error) {
        console.error('Quote error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

export default router;
