const express = require("express");
const router = express.Router();
const db = require("../../lib/mariadb.js");

// Fetch current rates
router.get("/", async (req, res) => {
  let dbQuery = await (await db).query("select * from electrical_rate");

  let resArray = [];
  for (obj of dbQuery) {
    let newObj = {
      start: obj.start_time,
      end: obj.end_time,
      normalRate: obj.normal_rate,
      loadsheddingRate: obj.loadshedding_rate,
    };
    resArray.push(newObj);
  }

  return res.send(resArray);
});

// Add new rate time slot
router.post("/add", async (req, res) => {
  await (
    await db
  ).query(
    "insert into electrical_rate (start_time, end_time, normal_rate, loadshedding_rate) values (?,?,?,?)",
    [
      req.body.start,
      req.body.end,
      req.body.normalRate,
      req.body.loadsheddingRate,
    ]
  );

  return res.status(201).send({
    msg: "Rate added!",
  });
});

// Edit rate time slot
router.post("/edit", async (req, res) => {
  await (
    await db
  ).query(
    "update electrical_rate set start_time = ?, end_time = ?, normal_rate = ?, loadshedding_rate = ? where start_time = ? and end_time = ? and normal_rate = ? and loadshedding_rate = ?",
    [
      req.body.newStartTime,
      req.body.newEndTime,
      req.body.newNormalRate,
      req.body.newLoadsheddingRate,
      req.body.oldStartTime,
      req.body.oldEndTime,
      req.body.oldNormalRate,
      req.body.oldLoadsheddingRate,
    ]
  );

  return res.status(201).send({
    msg: "Rate time slot edited!",
  });
});

// Delete rate time slot
router.delete(
  "/delete/:start/:end/:normalRate/:loadsheddingRate",
  async (req, res) => {
    await (
      await db
    ).query(
      "delete from electrical_rate where start_time = ? and end_time = ? and normal_rate = ? and loadshedding_rate = ?",
      [
        req.params.start,
        req.params.end,
        req.params.normalRate,
        req.params.loadsheddingRate,
      ]
    );

    return res.status(201).send({
      msg: "Rate time slot deleted!",
    });
  }
);

module.exports = router;
