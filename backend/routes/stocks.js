import express from 'express';
import { cacheGet, cacheSet } from '../utils/cache.js';

const router = express.Router();

const AV_KEY  = process.env.ALPHA_VANTAGE_KEY;
const AV_BASE = 'https://www.alphavantage.co/query';

// Indian stocks — Alpha Vantage uses BSE exchange (.BSE suffix)
const STOCK_MAP = [
    { symbol: 'RELIANCE.NS',   avSym: 'RELIANCE.BSE',     name: 'Reliance Industries' },
    { symbol: 'TCS.NS',        avSym: 'TCS.BSE',           name: 'Tata Consultancy Services' },
    { symbol: 'HDFCBANK.NS',   avSym: 'HDFCBANK.BSE',      name: 'HDFC Bank' },
    { symbol: 'INFY.NS',       avSym: 'INFY.BSE',          name: 'Infosys' },
    { symbol: 'SBIN.NS',       avSym: 'SBIN.BSE',          name: 'State Bank of India' },
    { symbol: 'ICICIBANK.NS',  avSym: 'ICICIBANK.BSE',     name: 'ICICI Bank' },
    { symbol: 'ITC.NS',        avSym: 'ITC.BSE',           name: 'ITC Limited' },
    { symbol: 'WIPRO.NS',      avSym: 'WIPRO.BSE',         name: 'Wipro' },
    { symbol: 'BAJFINANCE.NS', avSym: 'BAJFINANCE.BSE',    name: 'Bajaj Finance' },
    { symbol: 'AXISBANK.NS',   avSym: 'AXISBANK.BSE',      name: 'Axis Bank' },
    { symbol: 'KOTAKBANK.NS',  avSym: 'KOTAKBANK.BSE',     name: 'Kotak Mahindra Bank' },
    { symbol: 'HINDUNILVR.NS', avSym: 'HINDUNILVR.BSE',    name: 'Hindustan Unilever' },
    { symbol: 'TITAN.NS',      avSym: 'TITAN.BSE',         name: 'Titan Company' },
    { symbol: 'ADANIENT.NS',   avSym: 'ADANIENT.BSE',      name: 'Adani Enterprises' },
    { symbol: 'ONGC.NS',       avSym: 'ONGC.BSE',          name: 'ONGC' },
];

// 24-hour cache so 15 stocks/day = well within 25 calls/day free limit
const TTL_PRICES  = 24 * 3600;
const TTL_HISTORY = 24 * 3600;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Fetch a single stock quote from Alpha Vantage
async function fetchAVQuote(avSym) {
    const url = `${AV_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(avSym)}&apikey=${AV_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json();
    const q = data['Global Quote'];
    if (!q || !q['05. price']) return null;
    return {
        price:         parseFloat(q['05. price'])           || 0,
        change:        parseFloat(q['09. change'])           || 0,
        changePercent: parseFloat(q['10. change percent'])   || 0,
        open:          parseFloat(q['02. open'])             || 0,
        high:          parseFloat(q['03. high'])             || 0,
        low:           parseFloat(q['04. low'])              || 0,
        volume:        parseInt(q['06. volume'])             || 0,
    };
}

// ── GET /prices ──────────────────────────────────────────────────────────────
// Returns all stocks — tries cache first, fetches from AV if needed.
// Sequential fetching with 13s delay keeps us under 5 req/min rate limit.
router.get('/prices', async (req, res) => {
    if (!AV_KEY) {
        console.error('ALPHA_VANTAGE_KEY is not set');
        return res.status(500).json({ message: 'Stock API key not configured' });
    }

    const requestedSymbols = req.query.symbols
        ? req.query.symbols.split(',')
        : STOCK_MAP.map(s => s.symbol);

    const stocks = STOCK_MAP.filter(s => requestedSymbols.includes(s.symbol));

    // Serve from cache where available
    const results = [];
    const toFetch = [];

    for (const stock of stocks) {
        const cached = await cacheGet(`av_price:${stock.symbol}`);
        if (cached) {
            results.push(cached);
        } else {
            toFetch.push(stock);
        }
    }

    // Return cached data immediately, fetch missing ones in background
    if (toFetch.length === 0) return res.json(results);

    // If we have some cached data, return it now and trigger background fetch
    if (results.length > 0) {
        res.json(results); // send partial cached data immediately

        // Background: fetch remaining stocks without blocking the response
        (async () => {
            for (const stock of toFetch) {
                try {
                    const quote = await fetchAVQuote(stock.avSym);
                    if (quote) {
                        const entry = { symbol: stock.symbol, name: stock.name, ...quote };
                        await cacheSet(`av_price:${stock.symbol}`, entry, TTL_PRICES);
                        console.log(`✅ Cached ${stock.symbol}`);
                    }
                } catch (e) {
                    console.error(`❌ ${stock.symbol}:`, e.message);
                }
                await sleep(13000); // 13s = safely under 5 req/min
            }
        })();
        return;
    }

    // No cached data at all — fetch first stock, return it, rest in background
    try {
        const first = toFetch[0];
        const quote = await fetchAVQuote(first.avSym);
        const firstEntry = quote
            ? { symbol: first.symbol, name: first.name, ...quote }
            : null;

        if (firstEntry) {
            await cacheSet(`av_price:${first.symbol}`, firstEntry, TTL_PRICES);
            results.push(firstEntry);
        }

        res.json(results);

        // Background: fetch the rest
        (async () => {
            for (const stock of toFetch.slice(1)) {
                await sleep(13000);
                try {
                    const q = await fetchAVQuote(stock.avSym);
                    if (q) {
                        const entry = { symbol: stock.symbol, name: stock.name, ...q };
                        await cacheSet(`av_price:${stock.symbol}`, entry, TTL_PRICES);
                        console.log(`✅ Cached ${stock.symbol}`);
                    }
                } catch (e) {
                    console.error(`❌ ${stock.symbol}:`, e.message);
                }
            }
        })();
    } catch (error) {
        console.error('Prices error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// ── GET /:symbol/history ─────────────────────────────────────────────────────
router.get('/:symbol/history', async (req, res) => {
    const { symbol } = req.params;
    const cacheKey = `av_hist:${symbol}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    if (!AV_KEY) return res.status(500).json({ message: 'Stock API key not configured' });

    try {
        const stock = STOCK_MAP.find(s => s.symbol === symbol);
        if (!stock) return res.status(404).json({ message: 'Symbol not found' });

        const url = `${AV_BASE}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(stock.avSym)}&outputsize=compact&apikey=${AV_KEY}`;
        const resp = await fetch(url);
        const data = await resp.json();

        const series = data['Time Series (Daily)'];
        if (!series) {
            console.error('History error for', symbol, data);
            return res.json({ quotes: [] });
        }

        const quotes = Object.entries(series)
            .slice(0, 90) // last 90 trading days (~3 months)
            .map(([date, v]) => ({
                date: new Date(date),
                open:   parseFloat(v['1. open']),
                high:   parseFloat(v['2. high']),
                low:    parseFloat(v['3. low']),
                close:  parseFloat(v['4. close']),
                volume: parseInt(v['5. volume']) || 0,
            }))
            .reverse(); // oldest first for charts

        const payload = { quotes, symbol };
        await cacheSet(cacheKey, payload, TTL_HISTORY);
        res.json(payload);
    } catch (error) {
        console.error('History error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// ── GET /quote/:symbol ───────────────────────────────────────────────────────
router.get('/quote/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const cached = await cacheGet(`av_price:${symbol}`);
    if (cached) return res.json({ symbol, price: cached.price, changePercent: cached.changePercent });

    if (!AV_KEY) return res.status(500).json({ message: 'Stock API key not configured' });

    try {
        const stock = STOCK_MAP.find(s => s.symbol === symbol);
        if (!stock) return res.status(404).json({ message: 'Symbol not found' });

        const q = await fetchAVQuote(stock.avSym);
        if (!q) return res.status(502).json({ message: 'No data returned' });

        const entry = { symbol, name: stock.name, ...q };
        await cacheSet(`av_price:${symbol}`, entry, TTL_PRICES);
        res.json({ symbol, price: q.price, changePercent: q.changePercent });
    } catch (error) {
        console.error('Quote error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

export default router;
