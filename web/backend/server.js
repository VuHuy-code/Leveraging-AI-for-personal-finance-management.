const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const authRouter = require("./routes/auth");
const dashboardRouter = require("./routes/dashboard");

const app = express();
const port = 5000;

// Middleware to handle JSON body
app.use(bodyParser.json());

// Enable CORS
app.use(cors());

// Use the routes
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});