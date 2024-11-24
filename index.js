const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const authRoutes = require("./Routes/Auth");
const User = require("./models/User");
app.use(express.json());
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("./db/db");
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
  })
);

app.use("/auth", authRoutes);

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "Token required" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Access Denied." });
    }
    req.user = decoded; // Add user info to request
    next();
  });
};

const uri = process.env.MONGO_URL;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("payeaseDB");
    const userCollection = database.collection("users");

    // protected route for all users
    app.get("/protected-route", verifyToken, (req, res) => {
      res.status(200).json({ message: "You have access", user: req.user });
    });

    //get user by email
    app.get("/user/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = {
        email: email,
      };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    //get all users
    app.get("/all-users", verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // get all pending user for update sattus
    app.get("/all-users-pending", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    //update user sattus
    app.put("/user-update/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const userData = req.body;
      console.log(userData);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: {} };
      if (userData.status === "Pending") {
        updateDoc.$set.status = "Approved";
      }
      if (userData.status === "Approved") {
        updateDoc.$set.status = "Pending";
      }
      if (userData?.newBonus === "InComplete") {
        if (userData.role === "agent") {
          updateDoc.$set.amount = 25646;
        }
        if (userData.role === "user") {
          updateDoc.$set.amount = 41;
        }
        updateDoc.$set.newBonus = "Complete";
      }
      console.log(updateDoc);
      const result = await userCollection.updateOne(filter, updateDoc);
      // res.send(result);
      res.status(200).json({ message: "Update data successful", result });
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
