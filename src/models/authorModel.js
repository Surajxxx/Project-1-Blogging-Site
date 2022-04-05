const mongoose = require("mongoose");

let validateEmail = function (email) {
  let regexForEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return regexForEmail.test(email);
};

const authorSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      enum: ["Mr", "Mrs", "Miss"],
      required: "title is required",
      trim : true
    },
    fname: { type: String, required: "First Name is required", trim: true },
    lname: { type: String, required: "Last Name is required", trim: true },
    email: {
      type: String,
      unique: true,
      validate: [validateEmail, "Please enter a valid email address"],
      required: "Email is required",
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: "Password is required"},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Author", authorSchema);
