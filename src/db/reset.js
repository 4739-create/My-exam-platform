const fs = require('fs');
const config = require('../config');

for (const suffix of ['', '-wal', '-shm']) {
  fs.rmSync(config.dbPath + suffix, { force: true });
}

const db = require('./index');
const seed = require('./seed');

void db;
const seeded = seed();
console.log(seeded ? 'Database reset and seeded successfully.' : 'Database reset (no new seed data).');
