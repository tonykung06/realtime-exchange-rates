import axios from 'axios';
import chunk from 'lodash.chunk';
import redis from 'redis';
import bluebird from 'bluebird';
import moment from 'moment';
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'redis'
});
const exchangeRatesCachKey = "exchangerates";

const currencies = {
    btc: 'Bitcoin',
    eth: 'Ether',
    ltc: 'Litecoin',
    xmr: 'Monero',
    xrp: 'Ripple',
    doge: 'Dogecoin',
    dash: 'Dash',
    maid: 'Maidsafeecoin',
    lsk: 'Lisk',
    sjcx: 'Storjcoin X'
};
const toUsd = v => `${v}-usd`;
const currencyPairs = Object.keys(currencies).map(toUsd);

const addBaseCurrencyEnglishName = apiResult => {
    apiResult.ticker.baseEnglishName = currencies[apiResult.ticker.base.toLowerCase()];
    return apiResult;
};

const batchFetchExchangeRates = (pairs) => {
    const requests = pairs.map(getExchangeRate);
    return axios.all(requests);
};

// TODO: error handling, should try to fetch as many results as you could
// Need to chunk requests as they don't offer an api to do batch exchange rate fetch and too many requests at one time will give 503
const getExchangeRates = async (pairs = currencyPairs) => {
    const chunks = chunk(pairs, 4);
    let results = [];
    try {
        for (let i = 0; i < chunks.length; i++) {
            results = [...results, ...(await batchFetchExchangeRates(chunks[i]))];
        }
    } catch (e) {
        console.log(`[ERROR] eat the error in getExchangeRates, details: ${e.message}`);
    }
    return results;
}

const getExchangeRate = (currencyPair) => {
    return axios.get(`https://api.cryptonator.com/api/ticker/${currencyPair}`).then(r => addBaseCurrencyEnglishName(r.data));
}

const formatExchangeRateCache = (exchangeRates) => {
    const exchangeRatesRedisCache = {};
    exchangeRates.forEach(v => {
        exchangeRatesRedisCache[`${v.ticker.base}-${v.ticker.target}`] = JSON.stringify(v);
    });
    return exchangeRatesRedisCache;
};

function* nextCurrencyPair() {
    let index = 0;
    const currencyCodes = Object.keys(currencies);
    while (true) {
        yield toUsd(currencyCodes[index]);
        index = (index + 1) % currencyCodes.length;
    }
}

const generateNextCurrencyPair = nextCurrencyPair();

const getNextExchangeRate = async () => {
    const individualExchangeRateUpdate = await getExchangeRate(generateNextCurrencyPair.next().value);
    if (individualExchangeRateUpdate.ticker.base === 'BTC') {
        console.log(`GOt update on ${individualExchangeRateUpdate.ticker.base}, price: ${individualExchangeRateUpdate.ticker.price}, timestamp: ${individualExchangeRateUpdate.timestamp}`)
    }
    const hashKey = `${individualExchangeRateUpdate.ticker.base}-${individualExchangeRateUpdate.ticker.target}`;
    await redisClient.HMSETAsync(exchangeRatesCachKey, {
        [hashKey]: JSON.stringify(individualExchangeRateUpdate)
    });
    console.log(`updated cache for exchange rate ${hashKey}`);
    return individualExchangeRateUpdate;
};

const fullRefreshCache = async () => {
    console.log('Doing a full refresh on exchange rates cache');
    const allExchangeRates = await getExchangeRates();
    await redisClient.HMSETAsync(exchangeRatesCachKey, formatExchangeRateCache(allExchangeRates));
    return allExchangeRates;
};

const getAllExchangeRatesWithCache = async () => {
    let allExchangeRates = [];
    try {
        const cachedAllExchangeRates = await redisClient.hgetallAsync(exchangeRatesCachKey);
        
        if (!cachedAllExchangeRates || Object.keys(cachedAllExchangeRates).length < 1) {
            allExchangeRates = fullRefreshCache();
        } else {
            console.log(`Cache hit - ${exchangeRatesCachKey}`);
            allExchangeRates = Object.values(cachedAllExchangeRates).map(jsonString => JSON.parse(jsonString));
        }
    } catch (e) {
        console.log(`[ERROR] eat the error in getAllExchangeRatesWithCache, details: ${e.message}`);
    }
    return allExchangeRates;
};

export {getNextExchangeRate, getAllExchangeRatesWithCache, fullRefreshCache};

