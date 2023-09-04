require('dotenv').config(); //Required to access .env files
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const path = require('path');
const { exec } = require('child_process');
const { execFile } = require('child_process');
const router = require('./routes/notionHtml'); // import the routes
const { generateHTML } = require('./controllers/notionHtml');
const { generate, webflowCollection } = require('./notablog-app/dist/index');

app.use(express.json());
app.use('/', router); //to use the routes
// Use bodyParser to parse JSON
app.use(bodyParser.json());
//URL calls paths must be before paths below to default html page. Otherwise, it will not work

const workDir = "./notablog-starter/"; // The first argument should be the workDir

app.post('/notionHtml/:pageId', async (req, res) => {
    const args = process.argv.slice(2); // Remove the first two elements (node executable and script name)
    const pageIdWithDash = req.params.pageId; // The second argument should be the pageIdToPublish
    const workDir = "./notablog-starter/"; // The first argument should be the workDir
    const regexNoDash = /([a-zA-Z0-9])/g;
    const matchregexNoDash = pageIdWithDash.replace(/-/g, '');
    const pageIdToPublish = matchregexNoDash
    //console.log("pageIdWithDash ",pageIdWithDash);
    //console.log("pageIdToPublish",pageIdToPublish);
    try{
      //const html = await generate(workDir, pageIdToPublish); // Replace 'page123' with the desired pageId
      const collectionItem = await webflowCollection(pageIdToPublish);

      const responseData = {
        "Existing Data": html,
        "webflowCollection": collectionItem,
      };
  
      // Send the entire JSON response
      res.json(responseData);
    } catch (error) {
      // Handle errors and send an error response
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }

});

module.exports = workDir;

if(process.env.NODE_ENV != "production"){
    app.get('/server/', async function(req, res){
         console.log('Main page loading...');
         res.sendFile(__dirname + '/client/public/index.html');
    });
    //__dirname returns the directory that the currently executing script is in
    //Thus, the resulting path is: ./root/web/index.html
    //Ref: https://stackoverflow.com/questions/25463423/res-sendfile-absolute-path
    app.use(express.static(path.join(__dirname, 'client')));
    //Put this last among all routes. Otherwise, it will return index.html to all fetch requests and trip up CORS. They interrupt each other
    // For any request that doesn't match, this sends the index.html file from the client. This is used for all of our React code.
    app.get('*', (req, res) =>{
        res.sendFile(path.join(__dirname+'/client/public/index.html'));
    })
} else if(process.env.NODE_ENV == "production"){
     app.get('/server/', async function(req, res){
         console.log('Main page loading...');
         res.sendFile(__dirname + '/client/build/index.html');
     });
     
     app.use(express.static(path.join(__dirname, 'client/build')));
    //Put this last among all routes. Otherwise, it will return HTML to all fetch requests and trip up CORS. They interrupt each other
    // For any request that doesn't match, this sends the index.html file from the client. This is used for all of our React code.
    //Eliminates need to set redirect in package.json at start script with concurrently
    app.get('*', (req, res) => {
         res.sendFile(path.join(__dirname+'/client/build/index.html'));
    })
}
//App will run on process.env.PORT by default. Must specify or Heroku uses its default port
//It runs on port 4000 only if process.env.PORT is not defined
const listener = app.listen(port || 3000, () => {
    if(port !== undefined){
        console.log(`App running on process.env.PORT     ${port}`);
    } else {
         console.log(`App running on PORT 4000`);
    }
});


 //import mongoose
 const mongoose = require('mongoose');
 var settings = {
  family: 4
};

 const connectDBrun = async () => {
    let err;
    try {
        //mongoose.set('strictQuery', false);
        await mongoose.connect("mongodb+srv://markmanfrey:QuKDSxhBcyM9LH9k@cluster0.qokt9ju.mongodb.net/html?retryWrites=true&w=majority", settings)

            console.log("MongoDB Connection -- Ready state is:", mongoose.connection.readyState);

    } catch (error) {
      err = error;
      console.error('Error connecting to MongoDB', error);
    }
  
    return err;
};

async function connectDB() {

  const error = await connectDBrun();

  if(error) {
    // handle error
    console.log('Error connecting to MongoDB: ');
    console.error(err);
  }
}

connectDB();