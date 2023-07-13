require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3000;
const routes = require('./routes/html'); // import the routes
const bodyParser = require("body-parser");
const app = express();
const helmet = require('helmet');
const compression = require('compression');

app.use(express.urlencoded({
    extended:true
}));


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use(function (req, res) {
    //res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Type', 'multipart/form-data')
    res.end(JSON.stringify(req.body, null, 2))
})

app.route('/')
.get(function (req, res) {
  res.sendFile(process.cwd() + '/index.html');
});

app.use('/', routes); //to use the routes

app.use(helmet());
app.use(compression());



const listener = app.listen(process.env.PORT || PORT, () => {
    console.log('App is listening on port ' + listener.address().port)
})

const connectDB = async () => {
    try {
        //mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI,
            { family: 4, 
            server: {socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 }},
            replset: {socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 }}});
        console.log(`MongoDB Connected: {conn.connection.host}`);
        console.log("MongoDB Connection -- Ready state is:", mongoose.connection.readyState);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
  }
connectDB();