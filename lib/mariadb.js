const mariadb = require("mariadb");

// Create connection
const conn = mariadb.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  connectionLimit: 5,
  database: "renewable_energy_trading_platform",
});

console.log("MariaDB connected");

module.exports = conn;
