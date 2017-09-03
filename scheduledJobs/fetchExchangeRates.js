import {CronJob} from 'cron';
import {getNextExchangeRate, fullRefreshCache} from '../services/fetchExchangeRates';

var emitter = require('socket.io-emitter')({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});
emitter.redis.on('error', onError);

function onError(err){
  console.log('socket.io-emitter error', err);
}

export default async function start() {
    try {
        console.log('testing');
        await fullRefreshCache();
    } catch (e) {
        console.log(`[ERROR] Failed to fetch and cache exchange rates with error ${e.message}`);
    }

    new CronJob('*/3 * * * * *', async () => {
        try {
            console.log('Fetching update for individual exchange rate every 3s');

             // TODO: only emit change if the data timestamp has proceeded
            const individualExchangeRate = await getNextExchangeRate();

            // TODO: since the current app has only one page and all clients are interested in the exchange rate updates, broadcasting is fine in this case.
            //  In case that we have multiple UI pages, and each of them is interested in different data updates, we need to use socketio Room/Namespace to avoid
            //  unnecessary updates published to clients.
            // io.emit('exchange-rate-updated', individualExchangeRate);
            emitter.emit('exchange-rate-updated', individualExchangeRate);
        } catch (e) {
            console.log(`[ERROR] Failed to fetch and cache individual exchange rate with error ${e.message}`);
        }
    }, null, true, 'America/Los_Angeles');
}
