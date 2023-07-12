//import html model
const html = require('../models/html');
const multer = require('multer');
const execSync = require('child_process').execSync;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
      },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const uploadImg = multer({storage: storage}).single('image');


//GET '/html'
const getAllhtml = (req, res) => {
    html.find({}, (err, data)=>{
        if (err){
            return res.json({Error: err});
        }
        return res.json(data);
    })
};
 
const express = require("express");

//POST '/html'
const newhtml = (express.urlencoded({ extended: false }),(req, res) => {
    //check if the html name already exists in db
    html.use(function (req, res) {
        //res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Type', 'multipart/form-data')
        res.end(JSON.stringify(req.body, null, 2))
    })
    let name = req.body.name;
    html.findOne({ name: name }).then((res, data) => {

        //if html not in db, add it
        if (!data) {
            //create a new html object using the html model and req.body
            const newhtml = new html({
                name: name,
                image: req.file.path,
                description: req.body.description,
                keywords: req.body.keywords,
                origin: req.body.origin,
                brew_time: req.body.brew_time,
                temperature: req.body.temperature,
            })
            execSync('notablog-app generate .')

            // save this object to database
            newhtml.save((err, data)=>{
                if(err) return res.json({Error: err});
                return res.json(data);
            })}
        //if there's an error or the html is in db, return a message         
        }).catch((err) => {
            if(err) return res.json(`Something went wrong, please try again. ${err}`);
            return res.json({message:"html already exists"});
        });
});

//DELETE '/html'
const deleteAllhtml = (req, res) => {
    html.deleteMany({}, err => {
        if(err) {
          return res.json({message: "Complete delete failed"});
        }
        return res.json({message: "Complete delete successful"});
    })
};

//GET '/html/:name'
const getOnehtml = (req, res) => {
    let name = req.params.name; //get the html name

    //find the specific html with that name
    html.findOne({name:name}, (err, data) => {
    if(err || !data) {
        return res.json({message: "html doesn't exist."});
    }
    else return res.json(data); //return the html object if found
    });
};

//POST '/html/:name'
const newComment = (req, res) => {
    let name = req.params.name; //get the html to add the comment in
    let newComment = req.body.comment; //get the comment
    //create a comment object to push
    const comment = {
        text: newComment,
        date: new Date()
    }
    //find the html object
    html.findOne({name:name}, (err, data) => {
        if(err || !data || !newComment) {
            return res.json({message: "html doesn't exist."});
        }
        else {
            //add comment to comments array of the html object
            data.comments.push(comment);
            //save changes to db
            data.save(err => {
                if (err) { 
                return res.json({message: "Comment failed to add.", error:err});
                }
                return res.json(data);
            })  
        } 
    })
  };

//DELETE '/html/:name'
const deleteOnehtml = (req, res) => {
    let name = req.params.name; // get the name of html to delete

    html.deleteOne({name:name}, (err, data) => {
    //if there's nothing to delete return a message
    if( data.deletedCount === 0) return res.json({message: "html doesn't exist."});
    //else if there's an error, return the err message
    else if (err) return res.json(`Something went wrong, please try again. ${err}`);
    //else, return the success message
    else return res.json({message: "html deleted."});
    });
};

//export controller functions
module.exports = {
    getAllhtml, 
    newhtml,
    deleteAllhtml,
    getOnehtml,
    newComment,
    deleteOnehtml,
    uploadImg
};