const fs = require("fs");
const express = require("express");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static("public"));

// API to trigger scraping for a city
app.get("/run-scraper", (req, res) => {
  const city = req.query.city || "mumbai";

  console.log(`UI triggered scrape for city: ${city}`);

  exec(`node scraper.js ${city}`, (error, stdout, stderr) => {
    if (error) {
      console.error("Scraper execution failed:", error.message);
      return res.status(500).send("Scraping failed. Please check server logs.");
    }

    console.log("Scraper completed successfully.");
    res.send("Scraping completed. You may now download the Excel file.");
  });
});

// API to download city-specific Excel file
app.get("/download", (req, res) => {
  const city = req.query.city || "mumbai";
  const filePath = path.join(__dirname, `events-${city}.xlsx`);

  if (!fs.existsSync(filePath)) {
    console.error(`Requested file not found: ${filePath}`);
    return res.status(404).send(
      "File not found. Please run 'Fetch Events' first."
    );
  }

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="events-${city}.xlsx"`
  );

  console.log(`Sending file to client: events-${city}.xlsx`);
  res.download(filePath);
});

// Start server
app.listen(PORT, () => {
  console.log(`Web application running at http://localhost:${PORT}`);
});
