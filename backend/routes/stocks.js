import express from 'express';
import { cacheGet, cacheSet } from '../utils/cache.js';

const router = express.Router();

// NSE stocks we care about
const STOCK_LIST = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN',
    'ICICIBANK', 'ITC', 'WIPRO', 'BAJFINANCE', 'AXISBANK',
    'KOTAKBANK', 'HINDUNILVR', 'TITAN', 'ADANIENT', 'ONGC'
];

const NSE_BASE = 'https://www.nseindia.com';
const TTL_PRICES = 60;   // 60s — real-time enough
const TTL_HIST = 600;  // 10 min for historical (Yahoo)
const TTL_IDX = 60;   // 60s for index data

// NSE session management
// NSE requires a cookie obtained by first visiting the homepage
let _session = { cookie: '', ts: 0 };

const NSE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.nseindia.com/',
    'Connection': 'keep-alive',
};

async function getSession() {
    // Refresh cookie every 4 minutes
    if (_session.cookie && Date.now() - _session.ts < 4 * 60 * 1000) {
        return _session.cookie;
    }
    try {
        const resp = await fetch(NSE_BASE + '/', {
            headers: {
                ...NSE_HEADERS,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            redirect: 'follow',
        });
        const raw = resp.headers.get('set-cookie') || '';
        // Extract key=value pairs, join with '; '
        const cookie = raw
            .split(/,(?=[^ ].*?=)/)
            .map(p => p.trim().split(';')[0])
            .filter(Boolean)
            .join('; ');
        _session = { cookie, ts: Date.now() };
        console.log('✅ NSE session refreshed');
        return cookie;
    } catch (e) {
        console.error('NSE session error:', e.message);
        return '';
    }
}

async function nseGet(path) {
    const cookie = await getSession();
    const resp = await fetch(NSE_BASE + path, {
        headers: { ...NSE_HEADERS, Cookie: cookie },
    });
    if (!resp.ok) throw new Error(`NSE ${resp.status}: ${path}`);
    return resp.json();
}

// GET /prices - Fetches ALL NIFTY 50 stocks in ONE call, filters our 15
router.get('/prices', async (req, res) => {
    const requestedSymbols = req.query.symbols
        ? req.query.symbols.split(',').map(s => s.replace('.NS', ''))
        : STOCK_LIST;

    const cacheKey = `nse_prices:${requestedSymbols.join(',')}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        // NIFTY 50 endpoint — returns all 50 stocks in one shot
        const data = await nseGet('/api/equity-stockIndices?index=NIFTY%2050');

        if (!data?.data?.length) {
            console.error('NSE prices: empty response');
            return res.json([]);
        }

        const prices = data.data
            .filter(s => requestedSymbols.includes(s.symbol))
            .map(s => ({
                symbol: s.symbol + '.NS',
                name: s.meta?.companyName || s.symbol,
                price: s.lastPrice || 0,
                change: s.change || 0,
                changePercent: s.pChange || 0,
                open: s.open || 0,
                high: s.dayHigh || 0,
                low: s.dayLow || 0,
                volume: s.totalTradedVolume || 0,
            }));

        console.log(`✅ NSE prices: ${prices.length} stocks`);
        if (prices.length > 0) await cacheSet(cacheKey, prices, TTL_PRICES);
        res.json(prices);

    } catch (error) {
        console.error('NSE prices error:', error.message);
        // Try refreshing session and retry once
        _session = { cookie: '', ts: 0 };
        res.status(502).json({ message: 'NSE data temporarily unavailable', error: error.message });
    }
});

// GET /indices (NIFTY 50 + SENSEX for topbar)
router.get('/indices', async (req, res) => {
    const cacheKey = 'nse_indices';
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        const [niftyData, sensexData] = await Promise.allSettled([
            nseGet('/api/allIndices'),
            fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN?interval=1d&range=1d')
                .then(r => r.json())
                .catch(() => fetch('https://api.bseindia.com/BseIndiaAPI/api/SensexData/w', {
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.bseindia.com/' }
                }).then(r => r.json()))
        ]);

        const indices = niftyData.status === 'fulfilled' ? (niftyData.value?.data || []) : [];
        const niftyEntry = indices.find(i => i.index === 'NIFTY 50');

        let sensexEntry = null;
        if (sensexData.status === 'fulfilled') {
            const sd = sensexData.value;
            if (sd?.chart?.result?.[0]?.meta) {
                const m = sd.chart.result[0].meta;
                sensexEntry = { price: m.regularMarketPrice, change: m.regularMarketPrice - m.previousClose, changePercent: ((m.regularMarketPrice - m.previousClose) / m.previousClose) * 100 };
            } else {
                const sRaw = Array.isArray(sd) ? sd[0] : sd?.Data?.[0] || sd;
                if (sRaw?.CurrValue || sRaw?.IndexValue) {
                    sensexEntry = { price: parseFloat(sRaw.CurrValue || sRaw.IndexValue) || 0, change: parseFloat(sRaw.Change || 0), changePercent: parseFloat(sRaw.PctChange || sRaw.PercentChange || 0) };
                }
            }
        }

        const result = {
            nifty: niftyEntry ? { symbol: '^NSEI', name: 'NIFTY 50', price: niftyEntry.last, change: niftyEntry.variation, changePercent: niftyEntry.percentChange } : null,
            sensex: sensexEntry ? { symbol: '^BSESN', name: 'SENSEX', ...sensexEntry } : null,
        };

        await cacheSet(cacheKey, result, TTL_IDX);
        res.json(result);
    } catch (error) {
        console.error('Indices error:', error.message);
        _session = { cookie: '', ts: 0 };
        res.status(502).json({ message: error.message });
    }
});


// GET /:symbol/history (Yahoo Finance v8 chart - no crumb needed)
router.get('/:symbol/history', async (req, res) => {
    const { symbol } = req.params;
    const range = req.query.range || '3mo';
    const interval = req.query.interval || '1d';

    const cacheKey = `yf_hist:${symbol}:${range}:${interval}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        // Yahoo Finance v8 /chart/ endpoint — does NOT require a crumb/cookie
        // Different from /v7/finance/quote which is blocked
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
        const resp = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://finance.yahoo.com/',
            }
        });

        if (!resp.ok) {
            // Fallback to query2 if query1 fails
            const resp2 = await fetch(
                `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                    }
                }
            );
            if (!resp2.ok) throw new Error(`Yahoo chart ${resp2.status}`);
            const d2 = await resp2.json();
            return buildHistoryResponse(d2, symbol, cacheKey, res);
        }

        const data = await resp.json();
        return buildHistoryResponse(data, symbol, cacheKey, res);

    } catch (error) {
        console.error('History error:', error.message);
        res.status(502).json({ message: error.message });
    }
});

async function buildHistoryResponse(data, symbol, cacheKey, res) {
    const result = data?.chart?.result?.[0];
    if (!result) return res.json({ quotes: [] });

    const ts = result.timestamp || [];
    const ohlcv = result.indicators?.quote?.[0] || {};

    const quotes = ts
        .map((t, i) => ({
            date: new Date(t * 1000),
            open: parseFloat((ohlcv.open?.[i] || 0).toFixed(2)),
            high: parseFloat((ohlcv.high?.[i] || 0).toFixed(2)),
            low: parseFloat((ohlcv.low?.[i] || 0).toFixed(2)),
            close: parseFloat((ohlcv.close?.[i] || 0).toFixed(2)),
            volume: ohlcv.volume?.[i] || 0,
        }))
        .filter(q => q.open && q.close);

    const payload = { quotes, symbol };
    await cacheSet(cacheKey, payload, TTL_HIST);
    res.json(payload);
}


// GET /quote/:symbol
router.get('/quote/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const cacheKey = `nse_quote:${symbol}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        const sym = symbol.replace('.NS', '');
        const data = await nseGet(`/api/quote-equity?symbol=${encodeURIComponent(sym)}`);

        const pd = data?.priceInfo;
        if (!pd) throw new Error('No price info');

        const payload = {
            symbol,
            price: pd.lastPrice || 0,
            changePercent: pd.pChange || 0,
        };
        await cacheSet(cacheKey, payload, TTL_PRICES);
        res.json(payload);

    } catch (error) {
        console.error('NSE quote error:', error.message);
        _session = { cookie: '', ts: 0 };
        res.status(502).json({ message: error.message });
    }
});

export default router;
