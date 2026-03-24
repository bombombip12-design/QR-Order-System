const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });
const connectDB = require('./config/db');
const app = require('./app');

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
