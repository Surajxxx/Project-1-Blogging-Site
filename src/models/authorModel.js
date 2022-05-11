const mongoose = require("mongoose");


const authorSchema = new mongoose.Schema({
    title: {
        type: String,
        enum: ["Mr", "Mrs", "Miss"],
        required: "title is required",
        trim: true
    },
    fname: { type: String, required: "First Name is required", trim: true },
    lname: { type: String, required: "Last Name is required", trim: true },
    email: {
        type: String,
        unique: true,
        required: "Email is required",
        lowercase: true,
        trim: true,
    },
    password: { type: String, required: "Password is required" },
}, { timestamps: true });

module.exports = mongoose.model("Author", authorSchema);