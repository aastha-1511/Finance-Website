import express from 'express';
import { cacheGet, cacheSet } from '../utils/cache.js';

const router = express.Router();

const STOCK_LIST = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN',
    'ICICIBANK', 'ITC', 'WIPRO', 'BAJFINANCE', 'AXISBANK',
    'KOTAKBANK', 'HINDUNILVR', 'TITAN', 'ADANIENT', 'ONGC'
];

const TTL_PRICES = 60;
const TTL_HIST   = 600;
const TTL_IDX    = 60;

const YF_HEADERS = {
    'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept':          'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer':         'https://finance.yahoo.com/',
    'Origin':          'https://finance.yahoo.com',
};

const COMPANY_NAMES = {
    'RELIANCE':   'Reliance Industries',
    'TCS':        'Tata Consultancy',
    'HDFCBANK':   'HDFC Bank',
    'INFY':       'Infosys',
    'SBIN':       'State Bank of India',
    'ICICIBANK':  'ICICI Bank',
    'ITC':        'ITC Limited',
    'WIPRO':      'Wipro',
    'BAJFINANCE': 'Bajaj Finance',
    'AXISBANK':   'Axis Bank',
    'KOTAKBANK':  'Kotak Mahindra Bank',
    'HINDUNILVR': 'HUL',
    'TITAN':      'Titan Company',
    'ADANIENT':   'Adani Enterprises',
    'ONGC':       'ONGC',
};

// NSE session (fallback)
const NSE_BASE    = 'https://www.nseindia.com';
let   _session    = { cookie: '', ts: 0 };
const NSE_HEADERS = {
    'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept':          'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer':         'https://www.nseindia.com/',
    'Connection':      'keep-alive',
};

async function getSession() {
    if (_session.cookie && Date.now() - _session.ts < 4 * 60 * 1000) return _session.cookie;
    try {
        const resp = await fetch(NSE_BASE + '/', {
            headers: { ...NSE_HEADERS, 'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8' },
            redirect: 'follow',
        });
        const raw    = resp.headers.get('set-cookie') || '';
        const cookie = raw.split(/,(?=[^ ].*?=)/).map(p => p.trim().split(';')[0]).filter(Boolean).join('; ');
        _session     = { cookie, ts: Date.now() };
        return cookie;
    } catch (e) { return ''; }
}

async function nseGet(path) {
    const cookie = await getSession();
    const resp   = await fetch(NSE_BASE + path, { headers: { ...NSE_HEADERS, Cookie: cookie } });
    if (!resp.ok) throw new Error(`NSE ${resp.status}: ${path}`);
    return resp.json();
}

async function yfQuote(ticker) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    let res = await fetch(url, { headers: YF_HEADERS });
    if (!res.ok) {
        res = await fetch(
            `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
            { headers: YF_HEADERS }
        );
        if (!res.ok) throw new Error(`YF ${res.status} for ${ticker}`);
    }
    return res.json();
}

function parseYfMeta(ticker, meta, companyName) {
    const price     = meta.regularMarketPrice      || meta.previousClose || 0;
    const prev      = meta.chartPreviousClose      || meta.previousClose || price;
    const change    = parseFloat((price - prev).toFixed(2));
    const changePct = prev ? parseFloat(((price - prev) / prev * 100).toFixed(2)) : 0;
    const symbol    = ticker.endsWith('.NS') ? ticker : ticker + '.NS';
    return {
        symbol,
        name:          companyName || meta.shortName || meta.longName || ticker.replace('.NS', ''),
        price,
        change,
        changePercent: changePct,
        open:          meta.regularMarketOpen    || 0,
        high:          meta.regularMarketDayHigh || 0,
        low:           meta.regularMarketDayLow  || 0,
        volume:        meta.regularMarketVolume  || 0,
    };
}

// GET /prices
router.get('/prices', async (req, res) => {
    const requestedSymbols = req.query.symbols
        ? req.query.symbols.split(',').map(s => s.replace('.NS', '').toUpperCase())
        : STOCK_LIST;

    const cacheKey = `prices:${requestedSymbols.join(',')}`;
    const cached   = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        const results = await Promise.allSettled(
            requestedSymbols.map(sym => yfQuote(sym + '.NS'))
        );

        const prices = [];
        for (let i = 0; i < requestedSymbols.length; i++) {
            const sym = requestedSymbols[i];
            const r   = results[i];
            if (r.status === 'fulfilled') {
                const meta = r.value?.chart?.result?.[0]?.meta;
                if (meta) prices.push(parseYfMeta(sym + '.NS', meta, COMPANY_NAMES[sym]));
            }
        }

        if (prices.length === 0) {
            console.warn('Yahoo prices empty — trying NSE fallback');
            const data = await nseGet('/api/equity-stockIndices?index=NIFTY%2050');
            if (data?.data?.length) {
                const nsePrices = data.data
                    .filter(s => requestedSymbols.includes(s.symbol))
                    .map(s => ({
                        symbol:        s.symbol + '.NS',
                        name:          COMPANY_NAMES[s.symbol] || s.meta?.companyName || s.symbol,
                        price:         s.lastPrice         || 0,
                        change:        s.change            || 0,
                        changePercent: s.pChange           || 0,
                        open:          s.open              || 0,
                        high:          s.dayHigh           || 0,
                        low:           s.dayLow            || 0,
                        volume:        s.totalTradedVolume || 0,
                    }));
                if (nsePrices.length > 0) await cacheSet(cacheKey, nsePrices, TTL_PRICES);
                return res.json(nsePrices);
            }
        }

        console.log(`Yahoo prices: ${prices.length} stocks`);
        if (prices.length > 0) await cacheSet(cacheKey, prices, TTL_PRICES);
        res.json(prices);

    } catch (error) {
        console.error('Prices error:', error.message);
        _session = { cookie: '', ts: 0 };
        res.status(502).json({ message: 'Stock price data temporarily unavailable', error: error.message });
    }
});

// GET /indices
router.get('/indices', async (req, res) => {
    const cacheKey = 'indices';
    const cached   = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        const [niftyRaw, sensexRaw] = await Promise.allSettled([
            yfQuote('^NSEI'),
            yfQuote('^BSESN'),
        ]);

        let niftyEntry  = null;
        let sensexEntry = null;

        if (niftyRaw.status === 'fulfilled') {
            const meta = niftyRaw.value?.chart?.result?.[0]?.meta;
            if (meta) {
                const price = meta.regularMarketPrice || meta.previousClose || 0;
                const prev  = meta.chartPreviousClose || meta.previousClose || price;
                niftyEntry  = { symbol: '^NSEI', name: 'NIFTY 50', price, change: parseFloat((price - prev).toFixed(2)), changePercent: prev ? parseFloat(((price - prev) / prev * 100).toFixed(2)) : 0 };
            }
        }

        if (sensexRaw.status === 'fulfilled') {
            const meta = sensexRaw.value?.chart?.result?.[0]?.meta;
            if (meta) {
                const price  = meta.regularMarketPrice || meta.previousClose || 0;
                const prev   = meta.chartPreviousClose || meta.previousClose || price;
                sensexEntry  = { symbol: '^BSESN', name: 'SENSEX', price, change: parseFloat((price - prev).toFixed(2)), changePercent: prev ? parseFloat(((price - prev) / prev * 100).toFixed(2)) : 0 };
            }
        }

        if (!niftyEntry) {
            try {
                const d = await nseGet('/api/allIndices');
                const e = (d?.data || []).find(i => i.index === 'NIFTY 50');
                if (e) niftyEntry = { symbol: '^NSEI', name: 'NIFTY 50', price: e.last, change: e.variation, changePercent: e.percentChange };
            } catch (_) {}
        }

        console.log(`Indices — NIFTY: ${niftyEntry?.price}, SENSEX: ${sensexEntry?.price}`);

        const result = { nifty: niftyEntry, sensex: sensexEntry };
        if (niftyEntry || sensexEntry) await cacheSet(cacheKey, result, TTL_IDX);
        res.json(result);

    } catch (error) {
        console.error('Indices error:', error.message);
        res.status(502).json({ message: error.message });
    }
});

// GET /:symbol/history
router.get('/:symbol/history', async (req, res) => {
    const { symbol } = req.params;
    const range      = req.query.range    || '3mo';
    const interval   = req.query.interval || '1d';
    const cacheKey   = `hist:${symbol}:${range}:${interval}`;
    const cached     = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        const url  = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
        let resp   = await fetch(url, { headers: YF_HEADERS });
        if (!resp.ok) {
            resp = await fetch(
                `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`,
                { headers: YF_HEADERS }
            );
            if (!resp.ok) throw new Error(`Yahoo chart ${resp.status}`);
        }
        return buildHistoryResponse(await resp.json(), symbol, cacheKey, res);
    } catch (error) {
        console.error('History error:', error.message);
        res.status(502).json({ message: error.message });
    }
});

async function buildHistoryResponse(data, symbol, cacheKey, res) {
    const result = data?.chart?.result?.[0];
    if (!result) return res.json({ quotes: [] });

    const ts    = result.timestamp || [];
    const ohlcv = result.indicators?.quote?.[0] || {};

    const quotes = ts
        .map((t, i) => ({
            date:   new Date(t * 1000),
            open:   parseFloat((ohlcv.open?.[i]  || 0).toFixed(2)),
            high:   parseFloat((ohlcv.high?.[i]  || 0).toFixed(2)),
            low:    parseFloat((ohlcv.low?.[i]   || 0).toFixed(2)),
            close:  parseFloat((ohlcv.close?.[i] || 0).toFixed(2)),
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
    const cacheKey   = `quote:${symbol}`;
    const cached     = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    try {
        const data = await yfQuote(symbol);
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta) throw new Error('No quote data');

        const sym     = symbol.endsWith('.NS') ? symbol : symbol + '.NS';
        const base    = sym.replace('.NS', '').toUpperCase();
        const payload = parseYfMeta(sym, meta, COMPANY_NAMES[base]);
        await cacheSet(cacheKey, payload, TTL_PRICES);
        res.json(payload);

    } catch (error) {
        console.error('Quote error:', error.message);
        res.status(502).json({ message: error.message });
    }
});

export default router;
