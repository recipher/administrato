const zg = require('zapatos/generate');

(async () => {
  await zg.generate({ db: { connectionString: process.env.DATABASE_URL }});
})();