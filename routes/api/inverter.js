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
  for (prop in req.body) {
    await (
      await db
    ).query("update general set value = ? where field = ?", [
      `${req.body[prop]}`,
      `${prop}`,
    ]);
  }

  return res.status(201).send({
    msg: "Inverter settings edited!",
  });
});

module.exports = router;
