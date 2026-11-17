const cors = require('cors');

module.exports = cors({
  origin: [
    'http://localhost:5052',
    'http://localhost:2051',
    'https://juanesteban-prog.github.io'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});