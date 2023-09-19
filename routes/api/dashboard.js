const express = require("express");
const router = express.Router();
const db = require("../../lib/mariadb.js");
const influxdb = require("../../lib/influxdb");

// Get general information for home dashboard
router.get("/homeowner/:id", async (req, res) => {
  // Fetch home info from MariaDB
  let homeQuery = await (
    await db
  ).query("select * from home where homeowner_id = ?", [req.params.id]);
  let home = homeQuery[0];
  let receivePowerLoadshedding = 0;
  if (home.receive_power_loadshedding === 0) {
    receivePowerLoadshedding = "No";
  } else {
    receivePowerLoadshedding = "Yes";
  }

  // Fetch general info (loadshedding, load limit)
  let generalQuery = await (await db).query("select * from general");
  // Parse into true or false
  let loadControl = JSON.parse(
    generalQuery.find((obj) => obj.field === "load_control").value
  );
  let loadshedding = JSON.parse(
    generalQuery.find((obj) => obj.field === "loadshedding").value
  );
  // Get correct string for load shedding status
  if (loadshedding === false) {
    loadshedding = "Inactive";
  } else {
    loadshedding = "Active";
  }
  // Parse into number
  let loadLimit = parseFloat(
    generalQuery.find((obj) => obj.field === "load_limit_home").value
  );
  if (!loadControl) {
    loadLimit = "Inactive";
  }

  // Fetch electrical rates
  let ratesQuery = await (await db).query("select * from electrical_rate");
  let rate = getRate(ratesQuery, loadshedding);

  // Fetch measurements
  let powerQuery = await influxdb.query(
    `select * from power where device = 'home-${home.home_number}' order by time desc limit 1`
  );
  let power = getPower(powerQuery);

  // Format response
  let resObj = {
    account_balance: home.account_balance,
    power: power,
    current_rate: rate,
    loadshedding: loadshedding,
    receive_power_loadshedding: receivePowerLoadshedding,
    load_limit: loadLimit,
  };

  return res.send(resObj);
});

// Get general information for admin dashboard
router.get("/admin", async (req, res) => {
  // Fetch general info (loadshedding, load limit)
  let generalQuery = await (await db).query("select * from general");
  // Parse into true or false
  let loadControl = JSON.parse(
    generalQuery.find((obj) => obj.field === "load_control").value
  );
  let loadshedding = JSON.parse(
    generalQuery.find((obj) => obj.field === "loadshedding").value
  );
  // Get correct string for load shedding status
  if (loadshedding === false) {
    loadshedding = "Inactive";
  } else {
    loadshedding = "Active";
  }
  // Parse into number
  let loadLimit = parseFloat(
    generalQuery.find((obj) => obj.field === "load_limit_community").value
  );
  if (!loadControl) {
    loadLimit = "Inactive";
  }

  // Fetch electrical rates
  let ratesQuery = await (await db).query("select * from electrical_rate");
  let rate = getRate(ratesQuery, loadshedding);

  // Fetch measurements
  let powerQuery = await influxdb.query(
    `select * from power where device = 'community' order by time desc limit 1`
  );
  let power = getPower(powerQuery);

  // Format response
  let resObj = {
    power: power,
    current_rate: rate,
    loadshedding: loadshedding,
    load_limit: loadLimit,
  };

  return res.send(resObj);
});

// Get correct value for rate
function getRate(query, loadshedding) {
  let rate = 0;
  for (row of query) {
    let valid = betweenTimes(row.start_time, row.end_time);
    if (valid) {
      if (loadshedding === "Active") {
        rate = row.loadshedding_rate;
      } else {
        rate = row.normal_rate;
      }
    }
  }
  return rate;
}

// Get correct value for power
function getPower(query) {
  let power = "No data";
  if (query[0] !== undefined) {
    // Check if measurement is within last minute
    const date = new Date(query[0].time);
    const timeNow = Date.now();
    const timeDifference = timeNow - date;
    const timeDifferenceInMinutes = timeDifference / (1000 * 60);
    if (timeDifferenceInMinutes < 1) {
      power = query[0].value;
    } else {
      power = "Offline";
    }
  }
  return power;
}

// Function to check if current time is between two time slots.
function betweenTimes(startTime, endTime) {
  currentDate = new Date();

  startDate = new Date(currentDate.getTime());
  startDate.setHours(startTime.split(":")[0]);
  startDate.setMinutes(startTime.split(":")[1]);
  startDate.setSeconds(startTime.split(":")[2]);

  endDate = new Date(currentDate.getTime());
  endDate.setHours(endTime.split(":")[0]);
  endDate.setMinutes(endTime.split(":")[1]);
  endDate.setSeconds(endTime.split(":")[2]);

  valid = startDate < currentDate && endDate > currentDate;
  return valid;
}

module.exports = router;
