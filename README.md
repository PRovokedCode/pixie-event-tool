# Pixie Event Discovery Tool

A Kafka-based automated event discovery tool with a simple web interface that allows a user to:

* Select a city
* Trigger automated event scraping
* Stream events through Kafka
* Generate a clean, city-specific Excel file
* Download the file anywhere on their system

This project demonstrates:

* Real operational problem solving
* Data handling and automation thinking
* Event streaming architecture
* Containerized infrastructure (Docker)
* Usable web-based tool for non-technical users

---

## Architecture Overview

```
User (Web UI)
      |
      v
Express Web App (server.js)
      |
      v
scraper.js  --->  Kafka (Docker)  --->  consumer.js (stream proof)
      |
      v
Creates city-specific Excel file
      |
      v
User downloads file anywhere
```

### Why Kafka is used

Even though Excel is written directly by the scraper, Kafka is kept in the pipeline to:

* Demonstrate streaming architecture
* Match the assignment requirement
* Show real data engineering thinking

---

## Tech Stack

| Component        | Technology                        |
| ---------------- | --------------------------------- |
| Backend          | Node.js                           |
| Messaging        | Apache Kafka + Zookeeper (Docker) |
| Web Server       | Express.js                        |
| Scraping         | Axios + Cheerio                   |
| Streaming        | KafkaJS                           |
| File Output      | xlsx                              |
| Containerization | Docker & Docker Compose           |

---

## Prerequisites (Must install first)

1. **Node.js (LTS recommended)**
   [https://nodejs.org/](https://nodejs.org/)

2. **Docker Desktop**
   [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

3. **Git (optional, for cloning)**
   [https://git-scm.com/](https://git-scm.com/)

---

## Step 1 — Clone the repository

```bash
git clone https://github.com/PRovokedCode/pixie-event-tool.git
cd pixie-event-tool
```

---

## Step 2 — Install dependencies

```bash
npm install
```

This installs:

* express
* axios
* cheerio
* kafkajs
* xlsx

---

## Step 3 — Start Kafka (Docker)

```bash
docker-compose up -d
```

Verify containers are running:

```bash
docker ps
```

You should see Kafka and Zookeeper in **Up** state.

---

## Step 4 — Start Kafka Consumer (keep running)

Open a new terminal and run:

```bash
node consumer.js
```

You should see:

```
Connecting to Kafka consumer...
Listening to events.raw...
```

Keep this terminal open.

---

## Step 5 — Start Web Application

Open another terminal and run:

```bash
node server.js
```

You should see:

```
Web app running at http://localhost:3000
```

Open in browser:

```
http://localhost:3000
```

---

## Step 6 — Use the Tool (For Judges / Users)

In the Web UI:

1. Select a **city** from dropdown

2. Click **Fetch Events**

   * The scraper runs automatically
   * Data is streamed through Kafka
   * Excel file is generated in the project folder

3. Click **Download Excel**

4. The browser will show a **Save As** dialog — you can save the file anywhere.

---

## What file will be generated?

For city **Mumbai**, the tool creates:

```
events-mumbai.xlsx
```

For **Delhi**:

```
events-delhi.xlsx
```

Each run **overwrites the previous file for that city** to keep results clean.

---

## Data Fields in Excel

Each row contains:

| Column    | Meaning             |
| --------- | ------------------- |
| eventName | Name of event       |
| city      | Selected city       |
| venue     | Event venue         |
| date      | Event date          |
| category  | Event type          |
| url       | Link to event       |
| status    | Upcoming            |
| scrapedAt | Timestamp of scrape |

---

## How Scraping Works

1. **Primary Attempt: BookMyShow**

   * Often blocked (403).

2. **Automatic Fallback: Allevents**

   * Reliable public source
   * Returns real event listings

3. **Streaming:**

   * All events are published to Kafka topic:

     ```
     events.raw
     ```

---

## Troubleshooting

### If Kafka is not running

```bash
docker-compose down
docker-compose up -d
```

### If Web app says “File not found”

Click **Fetch Events** again before downloading.

### If Docker fails

Restart Docker Desktop and try again.

---

## Author

PRovokedCode

---

## License

MIT
