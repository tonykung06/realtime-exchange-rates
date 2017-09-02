import {CronJob} from 'cron';
import {getNextExchangeRate} from '../services/fetchExchangeRates';

export default function start(io) {
    new CronJob('*/3 * * * * *', function() {
        // TODO: only emit change if the data timestamp has proceeded
        getNextExchangeRate().then(r => {
            // TODO: only publish to clients who are interested in this topic
            io.emit('exchange-rate-updated', r);
        }).catch(e => {
            console.log(`Failed to getNextExchangeRate with error ${e.message}`);
        })
        
        console.log('You will see this message every second');
    }, null, true, 'America/Los_Angeles');
}
