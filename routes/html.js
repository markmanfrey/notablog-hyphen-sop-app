const express = require('express'); //import express
const router  = express.Router(); 
const htmlController = require('../controllers/html');
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

router.post('/html', htmlController.newhtml); 
router.get('/html', htmlController.getAllhtml);
router.delete('/html', htmlController.deleteAllhtml);
router.get('/html/:name', htmlController.getOnehtml);
router.post('/html/:name', htmlController.newComment);
router.delete('/html/:name', htmlController.deleteOnehtml);
router.post("/html", htmlController.uploadImg, htmlController.newhtml);

module.exports = router; // export to use in server.js

