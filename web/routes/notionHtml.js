const express = require('express'); //import express
const notionHtmlController = require('../controllers/notionHtml');
const router  = express.Router(); 

const multer = require('multer');
const upload = multer();

router.post('/notionHtml/:pageId', upload.none(), function(req, res, next) {
    //notionHtmlController.cacheHTML(req, res, next);
    next();
});

module.exports = router; // export to use in server.js

