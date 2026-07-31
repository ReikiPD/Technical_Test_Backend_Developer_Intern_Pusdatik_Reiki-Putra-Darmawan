const express = require('express');
const app = express();
const morgan = require('morgan');
const pool = require('./config/db');
const attendanceRoutes = require('./routes/attendanceRoutes');

app.use(morgan('dev'));
app.use(express.json());

pool.query('SELECT NOW()')
  .then(res => console.log('DB Connected:', res.rows[0]))
  .catch(err => console.error(err));

app.use(express.json());

app.use('/', attendanceRoutes);

app.get('/', (req, res) => {
  res.send('API Running...');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});