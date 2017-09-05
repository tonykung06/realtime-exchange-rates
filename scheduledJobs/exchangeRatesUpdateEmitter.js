const emitter = require('socket.io-emitter')({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});
emitter.redis.on('error', onError);

function onError(err){
  console.log('socket.io-emitter error', err);
}

const updateTopic = 'exchange-rate-updated';
const exchangeRatesAleadyEmitted = {};

export default {
    emit: function emit(exchangeRates) {
        if (!exchangeRates || exchangeRates.length < 1) {
            return;
        }
        const newExchangeRates = exchangeRates.reduce((accumulator, currentVal) => {
            const key = currentVal.ticker.base;
            const previousEmissionTimestamp = exchangeRatesAleadyEmitted[key];
            if (previousEmissionTimestamp && previousEmissionTimestamp >= Number(currentVal.timestamp)) {
                console.log(`${key} at ${currentVal.timestamp} was already seen before`);
            }
            if (!previousEmissionTimestamp || previousEmissionTimestamp < Number(currentVal.timestamp)) {
                exchangeRatesAleadyEmitted[key] = Number(currentVal.timestamp);
                return [...accumulator, currentVal];
            }
            return accumulator;
        }, []);
        if (newExchangeRates.length < 1) {
            return;
        }
        console.log(`emitting ${newExchangeRates.length} updates to ${updateTopic}`);
        // TODO: since the current app has only one page and all clients are interested in the exchange rate updates, broadcasting is fine in this case.
        //  In case that we have multiple UI pages, and each of them is interested in different data updates, we need to use socketio Room/Namespace to avoid
        //  unnecessary updates published to clients.
        newExchangeRates.forEach(individualExchangeRate => emitter.emit(updateTopic, individualExchangeRate));
    }
};