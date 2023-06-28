const mongoose = require("mongoose"); //import mongoose

// html schema
const htmlSchema = new mongoose.Schema({
    name: {type:String, required:true},
    image: String,
    description: String,
    keywords: String,
    origin: String,
    brew_time: Number,
    temperature: Number,
    comments: [{ text: String, date: {type:String, default: new Date()} }]
});

const html = mongoose.model('html', htmlSchema); //convert to model named html
module.exports = html; //export for controller use
