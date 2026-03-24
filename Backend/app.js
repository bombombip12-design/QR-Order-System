const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const Table = require('./Models/Table');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Thư mục ảnh upload (món ăn)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * Link dạng http://localhost:5000/order/T1 (trùng orderUrl trong DB) → chuyển sang SPA đặt món
 */
app.get('/order/:code', async (req, res, next) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    const table = await Table.findOne({ code });
    if (!table) return res.status(404).send('Không tìm thấy bàn');
    const front = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    /** Trang đặt món khách: /table/1 theo số bàn (không dùng _id) */
    res.redirect(302, `${front}/table/${table.tableNumber}`);
  } catch (err) {
    next(err);
  }
});

app.use('/api', routes);

app.use(errorHandler);

module.exports = app;
