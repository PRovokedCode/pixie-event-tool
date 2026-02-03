const fs = require("fs");
const xlsx = require("xlsx");
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "pixie-consumer",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "pixie-group" });

function getFileForCity(city) {
  return `events-${city}.xlsx`;
}

async function runConsumer() {
  console.log("🔌 Connecting to Kafka consumer...");
  await consumer.connect();

  await consumer.subscribe({
    topic: "events.raw",
    fromBeginning: false,   // IMPORTANT: only process new events
  });

  console.log("📡 Listening to events.raw...");

  // We keep only ONE map at a time (current city run)
  let currentCity = null;
  let eventMap = new Map();

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      const city = event.city.toLowerCase();

      // If user starts a NEW city run, reset everything
      if (currentCity !== city) {
        console.log(`🆕 New city detected: ${city} — starting fresh file`);
        currentCity = city;
        eventMap = new Map(); // clear old data
      }

      console.log(`📥 Received (${city}): ${event.eventName}`);

      // Always mark this event as Upcoming
      event.status = "Upcoming";
      event.lastSeenAt = new Date().toISOString();

      // Deduplicate only within THIS city run
      eventMap.set(event.url, event);

      // Convert to array and write a fresh file
      const updatedData = Array.from(eventMap.values());
      const FILE = getFileForCity(city);

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(updatedData);
      xlsx.utils.book_append_sheet(wb, ws, "Events");
      xlsx.writeFile(wb, FILE);

      console.log(`💾 Created fresh file: ${FILE} (${updatedData.length} events)`);
    },
  });
}

runConsumer();
