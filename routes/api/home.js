const express = require("express");
const router = express.Router();

const db = require("../../lib/mariadb.js");

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
    newObj = {
      number: dbQuery[i].home_number,
      owner: wholeName,
      balance: dbQuery[i].account_balance,
    };
    resArray.push(newObj);
    i++;
  }
  return res.send(resArray);
});

// Add new home
router.post("/add", async (req, res) => {
  await (
    await db
  ).query(
    "INSERT INTO home (home_number, homeowner_id, account_balance) VALUES (?,?,?)",
    [req.body.home_number, req.body.homeowner_id, 0]
  );
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

// Edit home
router.delete("/delete/:number", async (req, res) => {
  await (
    await db
  ).query("delete from home where home_number = ?", [req.params.number]);
  return res.status(201).send({
    msg: "Home deleted!",
  });
});

module.exports = router;
