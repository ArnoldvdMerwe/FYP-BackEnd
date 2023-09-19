// express for back end server
const express = require("express");
// body-parser for parsing incoming requests
const bodyParser = require("body-parser");
// CORS (Cross-Origin Resource Sharing) for altering which domains can connect to the server
const cors = require("cors");
const app = express();
// Port which server runs on
const PORT = 5000;

require("dotenv").config();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Set up routes
app.use("/api/user", require("./routes/api/user"));
app.use("/api/home", require("./routes/api/home"));
app.use("/api/measurement", require("./routes/api/measurement"));
app.use("/api/rate", require("./routes/api/rate"));
app.use("/api/inverter", require("./routes/api/inverter"));

// Run server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
