import {CronJob} from 'cron';
import {getNextExchangeRate, fullRefreshCache} from '../services/fetchExchangeRates';
import {MongoClient} from 'mongodb';
import bluebird from 'bluebird';
bluebird.promisifyAll(MongoClient);

const mongodbConnectionString = `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/exchangerates`;

const emitter = require('socket.io-emitter')({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});
emitter.redis.on('error', onError);

function onError(err){
  console.log('socket.io-emitter error', err);
}

const insertApiAudit = (db, auditRecords) => {
    if (!auditRecords || auditRecords.length < 1) {
        return;
    }
    db.collection('apiaudit').insertMany(auditRecords, (err, result) => {
        if (err) {
            console.log(`Failed to insert api audit, ${JSON.stringify(auditRecord)}`);
            return;
        }
        console.log(`Inserted ${result.result.n} (${result.ops.length}) api call audit record into the apiaudit collection`);
    });
}

export default async function start() {
    let mongoDbConnection = null;
    try {
        mongoDbConnection = await MongoClient.connectAsync(mongodbConnectionString);
    } catch (e) {
        console.log(`[ERROR] Failed to connect to mongodb with error ${e.message}`);
        process.exit(1);
    }
    try {
        const allExchangeRates = await fullRefreshCache();
        insertApiAudit(mongoDbConnection, allExchangeRates);
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
            emitter.emit('exchange-rate-updated', individualExchangeRate);
            insertApiAudit(mongoDbConnection, [individualExchangeRate]);
        } catch (e) {
            console.log(`[ERROR] Failed to fetch and cache individual exchange rate with error ${e.message}`);
        }
    }, null, true, 'America/Los_Angeles');
}
