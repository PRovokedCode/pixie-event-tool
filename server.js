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

  console.log(`🖱️ UI triggered scrape for: ${city}`);

  exec(`node scraper.js ${city}`, (error, stdout, stderr) => {
    if (error) {
      console.error("Scraper error:", error.message);
      return res.status(500).send("Scraping failed");
    }

    res.send("Scraping completed. Check Excel file.");
  });
});

// API to download Excel file
app.get("/download", (req, res) => {
  const city = req.query.city || "mumbai";
  const filePath = path.join(__dirname, `events-${city}.xlsx`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found. Please run Fetch Events first.");
  }

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="events-${city}.xlsx"`
  );

  res.download(filePath);
});



app.listen(PORT, () => {
  console.log(`🌐 Web app running at http://localhost:${PORT}`);
});
