import moment from 'moment';

export default (db, auditRecords) => {
    if (!auditRecords || auditRecords.length < 1) {
        return;
    }
    auditRecords = auditRecords.map(item => ({
        ...item,
        created_at: moment().unix()
    }))
    db.collection('apiaudit').insertMany(auditRecords, (err, result) => {
        if (err) {
            console.log(`Failed to insert api audit, ${JSON.stringify(auditRecord)}`);
            return;
        }
        console.log(`Inserted ${result.result.n} (${result.ops.length}) api call audit records into the apiaudit collection`);
    });
};
