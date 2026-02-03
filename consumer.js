const fs = require("fs");
const xlsx = require("xlsx");
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "pixie-consumer",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "pixie-group" });

const FILE = "events.xlsx";

// ---- Load or create Excel file ----
function loadExistingData() {
  if (!fs.existsSync(FILE)) {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet([]);
    xlsx.utils.book_append_sheet(wb, ws, "Events");
    xlsx.writeFile(wb, FILE);
    return new Map();
  }

  const wb = xlsx.readFile(FILE);
  const ws = wb.Sheets["Events"];
  const data = xlsx.utils.sheet_to_json(ws);

  const map = new Map();
  data.forEach(row => {
    if (row.url) map.set(row.url, row);
  });

  return map;
}

// ---- Main consumer ----
async function runConsumer() {
  console.log("🔌 Connecting to Kafka consumer...");
  await consumer.connect();

  await consumer.subscribe({
    topic: "events.raw",
    fromBeginning: true,
  });

  console.log("📡 Listening to events.raw...");

  const eventMap = loadExistingData();

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());

      console.log(`📥 Received: ${event.eventName}`);

      // ---- Deduplication + Expiry Handling ----

      // Mark all existing events as "Expired" by default
      for (let [url, evt] of eventMap.entries()) {
        evt.status = "Expired";
      }

      // Add or update the current event as Upcoming
      event.status = "Upcoming";
      event.lastSeenAt = new Date().toISOString();
      eventMap.set(event.url, event);


      // Convert map back to array
      const updatedData = Array.from(eventMap.values());

      // Write to Excel
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(updatedData);
      xlsx.utils.book_append_sheet(wb, ws, "Events");
      xlsx.writeFile(wb, FILE);

      console.log(`💾 Saved ${updatedData.length} unique events to events.xlsx`);
    },
  });
}

// Start consumer
runConsumer();
