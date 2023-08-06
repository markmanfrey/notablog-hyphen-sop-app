//import html model
const NotionHtml = require('../models/notionHtml');
const multer = require('multer');
const execSync = require('child_process').execSync;
const exec = require('child_process').execSync;
const express = require("express");
const React = require('react','useContext');
const {useState, useEffect} = require('react');
const ReactDOMServer = require ('react-dom/server');
//const Redis = require('ioredis');
//onst redis = require('../redis-client');
//const { generate, preview } = require('../../notablog-app/dist/index');
const generate = require('../notablog-app/dist/index');

//const uploadImg = multer({storage: storage}).single('image');
//const upload = multer();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
      },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

//GET '/html/getOnehtml'
const getOnehtmlX = async (req, res) => {
    try {
        const data = await NotionHtml.findOne({ name: req.body.pageID });
        if (!data){
            const newNotionHtml = new NotionHtml({
                command: req.body.command,
                workDir: req.body.workDir, // placeholder for now
                pageID: req.body.pageId,
            });
            const savedData = await newNotionHtml.save();
            return res.json(savedData);
        }
    } catch (err) {
        return res.json({Error: err});
    };
};

//export controller functions
//module.exports = {getOnehtmlX};

async function generateHTML (pageId){
    const args = process.argv.slice(2); // Remove the first two elements (node executable and script name)
    const workDir = args[0]; // The first argument should be the workDir
    const pageIdToPublish = args[1]; // The second argument should be the pageIdToPublish
  // Check if the required arguments are provided
  if (!workDir || !pageIdToPublish) {
    console.error('Usage: node main.js <workDir> <pageIdToPublish>');
    return;
  }

  try {
    const html = await generate(workDir, pageIdToPublish);
    console.log(html); // Use the 'html' value as needed
    return html;
  } catch (error) {
    console.error('Error generating HTML:', error);
  }
}

// const cacheHTML = async (req, res, next) => {
//     const { pageId } = req.params;
//     let html;

//     try{
//         html = await redis.get(htmlCacheKey(pageId));
    
//         if (!html) {
//             html = await generateHTML(pageId);
//             await redis.set(htmlCacheKey(pageId), html); 
//         }
    
//         res.html = html;

//         res.set('Cache-Control', 'public, max-age=3600');

//         const output = ReactDOMServer.renderToString(
//             React.createElement(HtmlComponent, { html })  
//         );

//         res.send(output);
        
//         next();

//     } catch (err) {
//         // handle error
//     }
// } 

function HtmlComponent({ html }) {
    return React.createElement(
      'div', 
      { dangerouslySetInnerHTML: {__html: html} }
    );
}


module.exports = {
    generateHTML,
    // cacheHTML: function(req, res, next) {
    //   // ...
    // } 
  }