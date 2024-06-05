require('dotenv').config();
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
const port = process.env.port;
const cors = require("cors");
const jwt = require("jsonwebtoken");
const uri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

function createToken(user) {
  const token = jwt.sign(
    { email: user.email },

    "secret",
    { expiresIn: "1h" }
  );
  return token;
}

  // Middleware to verify token
  function verifyToken(req, res, next) {
      const token = req.headers.authorization.split(" ")[1];
      const verify = jwt.verify(token, "secret");
      if (!verify?.email) {
        return res.send("You are not authorized");
      }
      req.user = verify.email;
      next();
    }

async function connectToDatabase() {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    const carCollection = client.db("TrackingTrip").collection("Car");
    const rentalPropertiesCollection = client.db("TrackingTrip").collection("rentHome");
    const userCollection = client.db("TrackingTrip").collection("UserCollection");

    //user
    app.get("/users", async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/users/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send(result);
    });

    app.get("/users/edit/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send(result);
    });

    app.patch("/users/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const userData = req.body;
      const result = await userCollection.updateOne(
        { email },
        { $set: userData },
        { upsert: true }
      );
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const token = createToken(user);
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({
          message: "user already exists",
          insertedId: null,
          token,
        });
      }
      const result = await userCollection.insertOne(user);

      res.send(result);
    });


    app.get("/rentCar", async (req, res) => {
      try {
        const carData = carCollection.find();
        const result = await carData.toArray();
        res.status(200).send(result);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });


    app.get("/rentCar/:id",  async (req, res) => {
      const id = req.params.id;
      const carData = await carCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(carData);
    });

    app.patch("/rentCar/:id",   async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await carCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    app.delete("/rentCar/:id",  async (req, res) => {
      const id = req.params.id;
      const result = await carCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });


    app.post("/rentCar",  async (req, res) => {
      try {
        const carData = req.body;
        const result = await carCollection.insertOne(carData);
        res.status(201).send(result);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    app.get("/RentalProperties", async (req, res) => {
      try {
        const rentalData = rentalPropertiesCollection.find();
        const result = await rentalData.toArray();
        res.status(200).send(result);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });
  
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

connectToDatabase();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
