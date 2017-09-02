import axios from 'axios';
import chunk from 'lodash.chunk';

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
    const requests = pairs.map(pair => {
        return axios.get(`https://api.cryptonator.com/api/ticker/${pair}`);
    });
    return axios.all(requests).then((results) => {
        return results.map(r => addBaseCurrencyEnglishName(r.data));
    });
};

// TODO: error handling, should try to fetch as many results as you could
const getAllExchangeRates = async () => {
    const chunks = chunk(currencyPairs, 4);
    let results = [];
    try {
        for (let i = 0; i < chunks.length; i++) {
            results = [...results, ...( await batchFetchExchangeRates(chunks[i]))];
        }
    } catch (e) {
        console.log(`[ERROR] eat the error in getAllExchangeRates, details: ${e.message}`);
    }
    return results;
}

const getExchangeRate = (urrencyPair) => {
    return axios.get(`https://api.cryptonator.com/api/ticker/${urrencyPair}`).then(r => addBaseCurrencyEnglishName(r.data));
}


function* nextCurrencyPair() {
    let index = 0;
    const currencyCodes = Object.keys(currencies);
    while (true) {
        yield toUsd(currencyCodes[index]);
        index = (index + 1) % currencyCodes.length;
    }
}

const generateNextCurrencyPair = nextCurrencyPair();

const getNextExchangeRate = () => {
    return getExchangeRate(generateNextCurrencyPair.next().value);
}

// TODO: with redis cache

export {getAllExchangeRates, getExchangeRate, getNextExchangeRate};

