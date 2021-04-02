const express = require('express');
const bodyParser = require('body-parser')
const authenticate = require('../authenticate');
const multer = require('multer');


// Configuring multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },

    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const imageFileFilter = (req, file, cb) => {
    // accept only the image files
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
        return cb(new Error("You can upload only image files!"), false);
    }
    cb(null, true);
}

const upload = multer({ storage: storage, fileFilter: imageFileFilter });

const uploadRouter = express.Router();

uploadRouter.route('/')
.get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	res.statusCode = 403;
	res.end('GET operation not suppported on /imageUpload');
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, upload.single('imageFile'), (req, res, next) => {
    console.log("Req.file = ", req.file);
    console.log("Req.body = ", req.body);
	res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(req.file);
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	res.statusCode = 403;
	res.end('PUT operation not suppported on /imageUpload');
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	res.statusCode = 403;
	res.end('DELETE operation not suppported on /imageUpload');
})


module.exports = uploadRouter;