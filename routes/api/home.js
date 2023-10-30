const express = require("express");
const router = express.Router();
const db = require("../../lib/mariadb.js");
const influxdb = require("../../lib/influxdb");

// Fetch details of homes
router.get("/homes", async (req, res) => {
  // Query SQL database for home details
  let dbQuery = await (await db).query("select * from home");

  let resArray = [];

  // Get corresponding names of homeowners for each home
  let ids = dbQuery.map((obj) => obj.homeowner_id);
  let i = 0;
  for (id of ids) {
    let userQuery = await (
      await db
    ).query("select first_name, last_name from user where user_id = ?", [id]);
    let wholeName = userQuery[0].first_name + " " + userQuery[0].last_name;

    // Get corresponding power
    let power = "No data";
    let powerQuery = await influxdb.query(
      `select * from power where device = 'home-${dbQuery[i].home_number}' order by time desc limit 1`
    );
    power = getPower(powerQuery);

    // Get correpsonding energy used over last 24 hours
    let energy = "No data";
    let energyQuery = await influxdb.query(
      `select * from total where device = 'home-${dbQuery[i].home_number}' and time > now() - 1d order by time desc`
    );
    energy = getEnergy(energyQuery);

    newObj = {
      number: dbQuery[i].home_number,
      owner: wholeName,
      power: power,
      energy: energy,
      balance: dbQuery[i].account_balance,
    };
    resArray.push(newObj);
    i++;
  }
  return res.send(resArray);
});

// Fetch details of home for a specific homeowner
router.get("/home/:id", async (req, res) => {
  // Query SQL database for home details
  let dbQuery = await (
    await db
  ).query("select * from home where homeowner_id = ?", [req.params.id]);

  let data = dbQuery[0];
  data.receive_power_loadshedding = Boolean(data.receive_power_loadshedding);

  return res.send(data);
});

// Add new home
router.post("/add", async (req, res) => {
  await (
    await db
  ).query(
    "INSERT INTO home (home_number, homeowner_id, account_balance, receive_power_loadshedding) VALUES (?,?,?,?)",
    [req.body.home_number, req.body.homeowner_id, 0, false]
  );
  setHomeLoadLimit();
  return res.status(201).send({
    msg: "Home added!",
  });
});

// Edit home
router.post("/edit", async (req, res) => {
  await (
    await db
  ).query(
    "update home set homeowner_id = ?, account_balance = ? where home_number = ?",
    [req.body.homeowner_id, req.body.account_balance, req.body.home_number]
  );
  return res.status(201).send({
    msg: "Home edited!",
  });
});

// Edit settings for receiving power during loadshedding or not
router.post("/edit_receive_power_loadshedding", async (req, res) => {
  // Set value
  await (
    await db
  ).query(
    "update home set receive_power_loadshedding = ? where homeowner_id = ?",
    [req.body.receive_power, req.body.id]
  );
  return res.status(201).send({
    msg: "Receive power during loadshedding edited!",
  });
});

// Add balance for a specific home
router.post("/add_balance", async (req, res) => {
  // Set value
  await (
    await db
  ).query(
    "update home set account_balance = account_balance + ? where homeowner_id = ?",
    [req.body.add_balance, req.body.id]
  );
  return res.status(201).send({
    msg: "Balance successfully increased!",
  });
});

// Delete home
router.delete("/delete/:number", async (req, res) => {
  await (
    await db
  ).query("delete from home where home_number = ?", [req.params.number]);
  setHomeLoadLimit();
  return res.status(201).send({
    msg: "Home deleted!",
  });
});

// Function to recalculate load limits if a new home is added or deleted
async function setHomeLoadLimit() {
  // Get number of homes
  let numHomesQuery = await (
    await db
  ).query("select count(home_number) as num from home");
  let numHomes = Number(numHomesQuery[0]["num"]);

  // Get community load limit
  let dbQuery = await (await db).query("select * from general");
  let communityLoadLimit = parseFloat(
    dbQuery.find((obj) => obj.field === "load_limit_community").value
  );

  // Update load limit for each home
  await (
    await db
  ).query("update general set value = ? where field = 'load_limit_home'", [
    `${communityLoadLimit / numHomes}`,
  ]);
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

// Get total energy use
function getEnergy(query) {
  let energy = "No data";
  if (query[0] !== undefined) {
    arrayLength = query.length;
    diff = query[0].value - query[arrayLength - 1].value;
    // Convert to Wh
    energy = diff;
  }
  return energy;
}

module.exports = router;
