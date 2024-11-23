const mongoose = require("mongoose");
require("dotenv").config();
const mongobd_url = process.env.MONGO_URL;
console.log(mongobd_url);
mongoose
  .connect(mongobd_url)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log(err);
  });
