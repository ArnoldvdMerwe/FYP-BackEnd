const express = require("express");
const router = express.Router();

const influxdb = require("../../lib/influxdb");

// Get the power measurements of a device (a home or community)
router.get("/power/:device", async (req, res) => {
  let query = await influxdb.query(
    `select * from power where device = '${req.params.device}' order by time desc limit 45`
  );
  const [labelsArray, dataArray] = formatForCharts(query);

  return res.status(200).send({
    data: dataArray,
    labels: labelsArray,
  });
});

// Get the energy measurements of a device (a home or community)
router.get("/energy/:device", async (req, res) => {
  let query = await influxdb.query(
    `select * from total where device = '${req.params.device}' order by time desc limit 45`
  );
  const [labelsArray, dataArray] = formatForCharts(query);

  let zeroedDataArray = formatEnergy(dataArray);

  return res.status(200).send({
    data: zeroedDataArray,
    labels: labelsArray,
  });
});

// Format query result in a managable format for the front end
function formatForCharts(queryResult) {
  queryResult = queryResult.reverse();
  let labelsArray = [];
  let dataArray = [];
  for (obj of queryResult) {
    let date = new Date(obj.time.toISOString());
    labelsArray.push(date.toLocaleTimeString());
    dataArray.push(obj.value);
  }
  return [labelsArray, dataArray];
}

// Format the measured energy so that it starts from 0
function formatEnergy(arr) {
  let firstNumber = arr[0];
  let newArray = [];

  for (item of arr) {
    let temp = item - firstNumber;
    newArray.push(temp);
  }
  return newArray;
}

module.exports = router;
