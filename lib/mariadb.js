const mariadb = require("mariadb");

// Create connection
const conn = mariadb.createConnection({
  host: "127.0.0.1",
  user: "arnold",
  password: "passmethesalt",
  connectionLimit: 5,
  database: "renewable_energy_trading_platform",
});

console.log("MariaDB connected");

module.exports = conn;
