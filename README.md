# Pixie Event Discovery Tool

## Overview
A Kafka-based event discovery pipeline that:
- Scrapes event data
- Streams via Kafka (Docker)
- Deduplicates records
- Stores structured output in Excel
- Runs on an hourly schedule

## Tech Stack
- Node.js
- Kafka + Zookeeper (Docker)
- Axios + Cheerio (scraping)
- KafkaJS
- xlsx (Excel)
- node-cron (scheduler)

## How to Run

1) Start Kafka
