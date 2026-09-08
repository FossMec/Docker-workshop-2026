const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

const PORT = Number(process.env.PORT || 5000);
const MONGO_HOST = process.env.MONGO_HOST || "localhost";
const MONGO_PORT = process.env.MONGO_PORT || "27017";
const MONGO_DB = process.env.MONGO_DB || "fossmec";

const mongoUri = `mongodb://${MONGO_HOST}:${MONGO_PORT}`;
const client = new MongoClient(mongoUri);
let database = null;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function getRegistrations() {
  if (!database) {
    await client.connect();
    database = client.db(MONGO_DB);
  }

  return database.collection("registrations");
}

app.get("/api/health", async (_req, res) => {
  try {
    const collection = await getRegistrations();
    await collection.database.command({ ping: 1 });
    res.json({ status: "ok", database: MONGO_DB });
  } catch (error) {
    console.error(error);
    res.status(503).json({ status: "error", message: "MongoDB is unavailable." });
  }
});

app.get("/api/registrations", async (_req, res) => {
  try {
    const collection = await getRegistrations();
    const registrations = await collection
      .find({}, { projection: { password: 0 } })
      .sort({ registeredAt: -1 })
      .toArray();

    res.json(registrations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load registrations." });
  }
});

app.post("/api/register", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim();
  const password = String(req.body?.password || "");

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }

  if (name.length > 80) {
    return res.status(400).json({ error: "Name must be 80 characters or fewer." });
  }

  if (email.length > 120 || !email.includes("@")) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  if (password.length < 4 || password.length > 80) {
    return res.status(400).json({ error: "Password must be between 4 and 80 characters." });
  }

  try {
    const collection = await getRegistrations();

    const registration = {
      name,
      email,
      password,
      registeredAt: new Date(),
      source: "web-app"
    };

    const result = await collection.insertOne(registration);

    res.status(201).json({
      _id: result.insertedId,
      name,
      email,
      registeredAt: registration.registeredAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not save registration." });
  }
});

app.delete("/api/registrations/:id", async (req, res) => {
  try {
    const collection = await getRegistrations();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid registration id." });
    }

    const result = await collection.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Registration not found." });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not delete registration." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`FOSSMEC registration demo running on port ${PORT}`);
  console.log(`MongoDB target: ${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`);
});
