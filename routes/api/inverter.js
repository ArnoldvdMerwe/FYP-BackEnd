const express = require("express");
const router = express.Router();
const db = require("../../lib/mariadb.js");

// Fetch current status
router.get("/", async (req, res) => {
  let dbQuery = await (await db).query("select * from general");

  // Format response
  let newObj = {
    simulateInverterToggle: JSON.parse(
      dbQuery.find((obj) => obj.field === "simulate_inverter").value
    ),
    powerOutageToggle: JSON.parse(
      dbQuery.find((obj) => obj.field === "loadshedding").value
    ),
    loadControlToggle: JSON.parse(
      dbQuery.find((obj) => obj.field === "load_control").value
    ),
    loadLimit: parseFloat(
      dbQuery.find((obj) => obj.field === "load_limit_community").value
    ),
  };

  return res.send(newObj);
});

// Update settings
router.post("/edit", async (req, res) => {
  // Store each property in correct place
  for (prop in req.body) {
    await (
      await db
    ).query("update general set value = ? where field = ?", [
      `${req.body[prop]}`,
      `${prop}`,
    ]);
  }

  // Calculate load limit for each home
  let numHomesQuery = await (
    await db
  ).query("select count(home_number) as num from home");
  let numHomes = Number(numHomesQuery[0]["num"]);
  // Update load limit for each home
  await (
    await db
  ).query("update general set value = ? where field = 'load_limit_home'", [
    `${req.body.load_limit_community / numHomes}`,
  ]);

  return res.status(201).send({
    msg: "Inverter settings edited!",
  });
});

module.exports = router;
