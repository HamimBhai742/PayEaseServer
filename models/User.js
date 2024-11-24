const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: {
    type: String,
    required: true,
    match: /^01[3,4,5,6,7,9][0-9]{8}$/,
  },
  role: { type: String, enum: ["user", "agent"], required: true },
  pin: { type: String, required: true }, // Will be hashed
  image: { type: String, require: true }, // URL for profile picture
  status: { type: String },
});

// // Hash the PIN before saving
// UserSchema.pre("save", async function (next) {
//   if (!this.isModified("pin")) return next();
//   this.pin = await bcrypt.hash(this.pin, 10);
//   next();
// });

// // Match PIN for Login
// UserSchema.methods.comparePin = async function (enteredPin) {
//   return await bcrypt.compare(enteredPin, this.pin);
// };
const User = mongoose.model("Users", UserSchema);
module.exports = User;
