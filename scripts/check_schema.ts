
import db from '../src/config/db.ts';

async function check() {
    console.log('Checking visits schema...');
    try {
        const info = await db.query(`PRAGMA table_info(visits)`);
        console.log(info);
    } catch (e) {
        console.error(e);
    }
}

check();
