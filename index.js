const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const port = 3000;
const cors = require('cors')
const jwt = require("jsonwebtoken");
const uri = 'mongodb+srv://TrackingTrip:adminadmin@cluster0.vz4h6lc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; 

app.use(cors());
app.use(express.json())

function createToken(user){
   const token = jwt.sign(
    {email:user.email},
   
    'secret',
    {expiresIn:"1h"}
  )
  return token   
}

async function connectToDatabase() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    const carCollection = client.db("TrackingTrip").collection("Car");
    const rentalPropertiesCollection = client.db("TrackingTrip").collection("rentHome");
    const userCollection = client.db("TrackingTrip").collection("UserCollection");
   
// Middleware to verify token
const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'Unauthorized access: Token missing' });
  }
  const token = req.headers.authorization.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.decoded = decoded;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).send({ message: 'Unauthorized access: Invalid token' });
  }
};



// JWT route
app.post('/jwt', (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '1h' });
  res.send({ token });
});


    //user 
    app.post('/users', async (req, res) => {
      const user = req.body;
      const token = createToken(user)
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query)
      
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null,token })
       
      }
      const result = await userCollection.insertOne(user)

      res.send(result);
    })


    app.patch('/rentCar/:id', async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          title: item.title,
          type: item.type,
          price: item.price,
          discount: item.discount,
          oldPrice: item.oldPrice,
          rating: item.rating,
          reviews: item.reviews,
          note: item.note
        }
      }
      const result = await carCollection.updateDoc(filter, updateDoc)
      res.send(result)
    })
  
    app.delete("/rentCar/:id",verifyToken, async(req,res) =>{
        const id = req.params.id
        const result = await carCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);

    })
   

    app.get("/rentCar/:id", async (req, res) => {
      const id = req.params.id;
      const carData = await carCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(carData);
    });

    app.post("/rentCar", async (req, res) => {
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
    app.get("/rentCar", async (req, res) => {
      try {
        const carData = carCollection.find();
        const result = await carData.toArray();
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





app.get('/', (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
