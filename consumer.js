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
  console.log("Connecting to Kafka consumer...");
  await consumer.connect();

  await consumer.subscribe({
    topic: "events.raw",
    fromBeginning: false, // Only process new events
  });

  console.log("Listening to topic: events.raw");

  // Track only the current city run
  let currentCity = null;
  let eventMap = new Map();

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      const city = event.city.toLowerCase();

      // If a new city run begins, reset state
      if (currentCity !== city) {
        console.log(`New city detected: ${city}. Starting fresh file.`);
        currentCity = city;
        eventMap = new Map();
      }

      console.log(`Received event for ${city}: ${event.eventName}`);

      // Normalize status
      event.status = "Upcoming";
      event.lastSeenAt = new Date().toISOString();

      // Deduplicate within this run
      eventMap.set(event.url, event);

      // Write fresh city-specific Excel file
      const updatedData = Array.from(eventMap.values());
      const filename = getFileForCity(city);

      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(updatedData);
      xlsx.utils.book_append_sheet(workbook, worksheet, "Events");
      xlsx.writeFile(workbook, filename);

      console.log(
        `Created fresh file: ${filename} with ${updatedData.length} events`
      );
    },
  });
}

runConsumer();
