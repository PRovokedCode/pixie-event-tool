console.log("FILE IS DEFINITELY RUNNING");
const xlsx = require("xlsx");


require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "pixie-scraper",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

async function scrapeAndSend(city) {
  console.log(`\n🚀 Starting scraper for city: ${city}`);

  await producer.connect();
  console.log("✅ Connected to Kafka.");

  const normalizedCity = city.toLowerCase();

const bookMyShowURL = `https://in.bookmyshow.com/explore/events-${normalizedCity}?cat=CT`;
const alleventsURL = `https://allevents.in/${normalizedCity}/all`;

// Try BookMyShow first
let url = bookMyShowURL;
console.log(`🔎 Trying BookMyShow: ${url}`);

let response;

try {
  response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    },
    timeout: 12000,
  });
} catch (err) {
  console.warn("⚠️ BookMyShow blocked — switching to Allevents...");
  url = alleventsURL;

  console.log(`🔎 Scraping fallback source: ${url}`);
  response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    },
    timeout: 20000,
  });
}


  const $ = cheerio.load(response.data);

  let events = [];

  $(".event-card, .event-item, .event-card-list").each((i, el) => {

    const name =
      $(el).find(".event-title, .title, h3, h2").first().text().trim() ||
      "Unknown Event";

    const venue =
      $(el).find(".venue-name, .venue, .location").first().text().trim() ||
      "Unknown Venue";

    const date =
      $(el).find(".date, .event-date, .eventDate").first().text().trim() ||
      "TBD";

    const link = $(el).find("a").attr("href");

    if (name && link) {
      events.push({
        eventName: name,
        city: city,
        venue: venue,
        date: date,
        category: "General",
        url: link.startsWith("http")
          ? link
          : "https://in.bookmyshow.com" + link,
        status: "Upcoming",
        scrapedAt: new Date().toISOString(),
      });
    }
  });

  console.log(`📦 Found ${events.length} events.`);

  for (let event of events) {
    await producer.send({
      topic: "events.raw",
      messages: [{ value: JSON.stringify(event) }],
    });
  }

  console.log(`✅ Sent ${events.length} events to Kafka topic: events.raw`);

// ---- CREATE CITY-SPECIFIC EXCEL FILE (PREDICTABLE NAME) ----
const filename = `events-${city}.xlsx`;

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(events);
xlsx.utils.book_append_sheet(wb, ws, "Events");
xlsx.writeFile(wb, filename);

console.log(`📁 Created Excel file: ${filename}`);

await producer.disconnect();

  console.log("🔌 Producer disconnected.\n");
}


async function scrapeDistrict(city) {
  const districtURL = `https://district.in/events/${city}`;

  console.log(`🔎 Scraping District: ${districtURL}`);

  try {
    const response = await axios.get(districtURL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 20000,
    });

    const $ = cheerio.load(response.data);

    $(".event-card, .event-item").each(async (i, el) => {
      const event = {
        eventName:
          $(el).find("h2, h3, .title").first().text().trim() ||
          "District Event",
        city,
        venue: "District Venue",
        date: new Date().toISOString().split("T")[0],
        category: "District",
        url: districtURL,
        status: "Upcoming",
        source: "District",
        scrapedAt: new Date().toISOString(),
      };

      await producer.send({
        topic: "events.raw",
        messages: [{ value: JSON.stringify(event) }],
      });
    });

    console.log("✅ District events sent to Kafka.");
  } catch (err) {
    console.warn("⚠️ District scrape failed:", err.message);
  }
}

// Read city from command line; default to mumbai if none is provided
const city = process.argv[2] || "mumbai";

(async () => {
  try {
    await scrapeAndSend(city);
    await scrapeDistrict(city);
  } catch (err) {
    console.error("❌ Top-level error:", err.message);
  }
})();



