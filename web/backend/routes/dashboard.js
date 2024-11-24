const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Example data for the dashboard
const usersFile = path.resolve(__dirname, "../data/users.json");

// Function to calculate dashboard data
const calculateDashboardData = () => {
  const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.isActive).length;
  const newUsers = users.filter(user => {
    const createdAt = new Date(user.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - createdAt);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  }).length;

  return {
    totalUsers,
    activeUsers,
    newUsers,
    // Add more data as needed
  };
};

// Endpoint to get dashboard data
router.get("/", (req, res) => {
  try {
    const dashboardData = calculateDashboardData();
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
});

module.exports = router;