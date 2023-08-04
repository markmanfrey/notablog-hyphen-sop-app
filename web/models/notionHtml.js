const mongoose = require("mongoose"); //import mongoose

// html schema
const NotionHtmlSchema = new mongoose.Schema({
    pageId: String,
    },
    {versionKey: false}
    );

const NotionHtml = mongoose.model('NotionHtml', NotionHtmlSchema); //convert to model named html
module.exports = NotionHtml; //export for controller use
