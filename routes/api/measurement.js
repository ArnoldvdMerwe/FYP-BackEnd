const express = require("express");
const router = express.Router();

const influxdb = require("../../lib/influxdb");

// Get the power measurements of a device (a home or community)
router.get("/power/:device", async (req, res) => {
  query = await influxdb.query(
    `select * from power where device = '${req.params.device}'`
  );
  const [labelsArray, dataArray] = formatForCharts(query);

  return res.status(200).send({
    data: dataArray,
    labels: labelsArray,
  });
});

// Format query result in a managable format for the front end
function formatForCharts(queryResult) {
  let labelsArray = [];
  let dataArray = [];
  for (obj of queryResult) {
    let date = new Date(obj.time.toISOString());
    labelsArray.push(date.toLocaleTimeString());
    dataArray.push(obj.value);
  }
  return [labelsArray, dataArray];
}

module.exports = router;
