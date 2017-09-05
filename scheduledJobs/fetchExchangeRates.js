import {CronJob} from 'cron';
import {getNextExchangeRate, fullRefreshCache} from '../services/fetchExchangeRates';
import emitter from './exchangeRatesUpdateEmitter';
import {MongoClient} from 'mongodb';
import bluebird from 'bluebird';
bluebird.promisifyAll(MongoClient);

const mongodbConnectionString = `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/exchangerates`;

const insertApiAudit = (db, auditRecords) => {
    if (!auditRecords || auditRecords.length < 1) {
        return;
    }
    db.collection('apiaudit').insertMany(auditRecords, (err, result) => {
        if (err) {
            console.log(`Failed to insert api audit, ${JSON.stringify(auditRecord)}`);
            return;
        }
        console.log(`Inserted ${result.result.n} (${result.ops.length}) api call audit records into the apiaudit collection`);
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
        emitter.emit(allExchangeRates);
        insertApiAudit(mongoDbConnection, allExchangeRates);
    } catch (e) {
        console.log(`[ERROR] Failed to fetch and cache exchange rates with error ${e.message}`);
    }

    new CronJob('*/6 * * * * *', async () => {
        try {
            const nextExchangeRate = await getNextExchangeRate();
            emitter.emit([nextExchangeRate]);
            insertApiAudit(mongoDbConnection, [nextExchangeRate]);
        } catch (e) {
            console.log(`[ERROR] Failed to fetch and cache individual exchange rate with error ${e.message}`);
        }
    }, null, true, 'America/Los_Angeles');
}
