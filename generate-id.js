const { argv } = require('node:process');
const ULID = require('ulid');

const [ foo, bar, count = 1 ] = argv;

const ids = [...Array(parseInt(count)).keys()].map(x => ULID.ulid());

ids.forEach(id => console.log(id));