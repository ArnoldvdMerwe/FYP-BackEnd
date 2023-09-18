const influx = require("influx");

const influxConn = new influx.InfluxDB({
  host: "localhost",
  database: "renewable_energy_trading_platform",
});

console.log("InfluxDB connected");

module.exports = influxConn;
