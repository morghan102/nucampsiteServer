const express = require('express');
const authenticate = require('../authenticate');
const multer = require('multer');
//multer has def routes but were adding our own
const cors = require('./cors');

const storage = multer.diskStorage({ //opts w config settings
    destination: (req, file, cb) => {//cb=callback
        cb(null, 'public/images');//null is for not havng an error
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)//so name of file on server will be the same on client side. if you dont set, multer will give it some random str as a name
    }
});

const imageFileFilter = (req, file, cb) => {
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {//regex looking NOT one of these extensions
        return cb(new Error('You can upload only image files!'), false);//false makes it reject this upload
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFileFilter});//now multer is ready here
//BUT the router still needs to be configured
const uploadRouter = express.Router();

uploadRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /imageUpload');
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, upload.single('imageFile'), (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(req.file);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /imageUpload');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end('DELETE operation not supported on /imageUpload');
});

module.exports = uploadRouter;