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

//transaction id create
function generateTransactionId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // Possible characters
  let transactionId = "";

  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length); // Get random index
    transactionId += characters[randomIndex]; // Append random character
  }

  return transactionId;
}

async function run() {
  try {
    const database = client.db("payeaseDB");
    const userCollection = database.collection("users");
    const cashCollection = database.collection("cash");
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

    //update user amount
    app.put("/update-user-amount", verifyToken, async (req, res) => {
      const userData = req.query;
      const userEmail = userData.email;
      const fiUserEmail = userData.emailFi;
      let sendAmount = parseFloat(userData.amount);
      const user = await userCollection.findOne({ email: userEmail });
      const fiUser = await userCollection.findOne({ email: fiUserEmail });
      console.log(fiUser);
      console.log(user);
      // if (sendAmount >= 100) {
      //   console.log("lllll");
      //   parseFloat(sendAmount + 5);
      // }
      console.log(userEmail, fiUserEmail, sendAmount, typeof sendAmount);
      const queryUser = {
        email: userEmail,
      };
      const queryFiUser = {
        email: fiUserEmail,
      };
      let updateDocUser = { $set: {} };
      let updateDocFiUser = { $set: {} };
      let fiUserDb = {};
      let userDb = {};
      if (sendAmount >= 100) {
        console.log("lllll");
        let sendBl = parseFloat(sendAmount + 5);
        console.log(sendBl);
        let avilableBlance = parseFloat(user.amount - sendBl);
        console.log(avilableBlance);
        let fiUserBl = parseFloat(fiUser.amount);
        let totalBl = fiUserBl + sendBl;
        console.log(totalBl);
        const now = new Date();
        userDb = {
          name: fiUser.name,
          email: user.email,
          phone: fiUser.phone,
          time: now,
          date: `${new Date().getHours() % 12 || 12}:${new Date()
            .getMinutes()
            .toString()
            .padStart(2, "0")}${
            new Date().getHours() >= 12 ? "pm" : "am"
          } ${new Date().getDate().toString().padStart(2, "0")}/${(
            new Date().getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}/${new Date().getFullYear().toString().slice(2)}`,
          type: "Send Money",
          reference: "",
          amount: sendAmount,
          charge: 5,
          trxID: generateTransactionId(),
        };
        fiUserDb = {
          name: user.name,
          email: fiUser.email,
          phone: now,
          time: new Date(),
          date: `${new Date().getHours() % 12 || 12}:${new Date()
            .getMinutes()
            .toString()
            .padStart(2, "0")}${
            new Date().getHours() >= 12 ? "pm" : "am"
          } ${new Date().getDate().toString().padStart(2, "0")}/${(
            new Date().getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}/${new Date().getFullYear().toString().slice(2)}`,
          type: "Received Money",
          reference: "",
          amount: sendAmount,
          charge: 5,
          trxID: generateTransactionId(),
        };
        console.log(userDb, fiUserDb);
        updateDocUser.$set.amount = avilableBlance;
        updateDocFiUser.$set.amount = totalBl;
      }

      if (sendAmount < 100) {
        console.log("lllll");
        let sendBl = parseFloat(sendAmount);
        console.log(sendBl);
        let avilableBlance = parseFloat(user.amount - sendBl);
        console.log(avilableBlance);
        let fiUserBl = parseFloat(fiUser.amount);
        let totalBl = fiUserBl + sendBl;
        console.log(totalBl);
        const now = new Date();
        userDb = {
          name: fiUser.name,
          email: user.email,
          phone: fiUser.phone,
          time: now,
          date: `${new Date().getHours() % 12 || 12}:${new Date()
            .getMinutes()
            .toString()
            .padStart(2, "0")}${
            new Date().getHours() >= 12 ? "pm" : "am"
          } ${new Date().getDate().toString().padStart(2, "0")}/${(
            new Date().getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}/${new Date().getFullYear().toString().slice(2)}`,
          type: "Send Money",
          reference: "",
          amount: sendAmount,
          charge: 0,
          trxID: generateTransactionId(),
        };
        fiUserDb = {
          name: user.name,
          email: fiUser.email,
          phone: user.phone,
          time: now,
          date: `${new Date().getHours() % 12 || 12}:${new Date()
            .getMinutes()
            .toString()
            .padStart(2, "0")}${
            new Date().getHours() >= 12 ? "pm" : "am"
          } ${new Date().getDate().toString().padStart(2, "0")}/${(
            new Date().getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}/${new Date().getFullYear().toString().slice(2)}`,
          type: "Received Money",
          reference: "",
          amount: sendAmount,
          charge: 0,
          trxID: generateTransactionId(),
        };
        console.log(userDb, fiUserDb);
        updateDocUser.$set.amount = avilableBlance;
        updateDocFiUser.$set.amount = totalBl;
      }
      const options = { ordered: true };
      const documents = [userDb, fiUserDb];
      const createCash = await cashCollection.insertMany(documents, options);
      const resultUser = await userCollection.updateOne(
        queryUser,
        updateDocUser
      );
      const resultFiUser = await userCollection.updateOne(
        queryFiUser,
        updateDocFiUser
      );
      res.status(200).json({
        resultUser,
        resultFiUser,
        createCash,
        message: "User amount update successful",
      });
    });

    //get transaction for user
    app.get("/transaction/:email", verifyToken, async (req, res) => {
      const query = { email: req.params.email };
      const result = await cashCollection.find(query).toArray();
      res.status(200).json({ message: "Success", result });
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
