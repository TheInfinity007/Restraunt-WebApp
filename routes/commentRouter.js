const express = require('express');
const bodyParser = require('body-parser')
const authenticate = require('../authenticate');
const cors = require('./cors');

const Comments = require('../models/comments');

const commentRouter = express.Router();

commentRouter.use(bodyParser.json());

commentRouter.route('/')


commentRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
	Comments.find(req.query).populate('author')
	.then((comments) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(comments);		
	}, (err) => next(err))
	.catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    if(req.body != null){
        req.body.author = req.user._id;
        Comments.create(req.body)
        .then((comment) => {
            Comments.findById(comment._id).populate('author')
            .then(comment => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(comment);
            }, err => next(err))
            .catch(err => next(err))            
        }, (err) => next(err))
        .catch((err) => next(err));
    }
    else{
        let err = new Error('Comment not found in request body');
        err.statusCode = 404;
        next(err);
    }	
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	res.statusCode = 403;
	res.end('PUT operation not suppported on /comments');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	Comments.deleteMany({})
	.then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);		
	}, (err) => next(err))
	.catch((err) => next(err));
});

commentRouter.route('/:commentId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
	Comments.findById(req.params.commentId).populate('author')
	.then((comment) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(comment);				
	}, (err) => next(err))
	.catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
	res.end('POST operation not suppported on /comments/' + req.params.commentId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
	Comments.findById(req.params.commentId)
	.then((comment) => {

		if(comment != null){			
			// current user is the owner of the comment to update
			if(comment.author.equals(req.user._id)){
                req.body.author = req.user._id;		
                // update the whole comment		
				Comments.findByIdAndUpdate(req.params.commentId, {
                    $set: req.body
                }, { new: true })
				.then((comment) => {					
					Comments.findById(comment._id).populate('author')
					.then((comment) => {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.json(comment);
					})
				}, (err) => next(err));
			}
			else{
				let err = new Error("Your are not authorised to update this comment!");
				err.status = 403;
				next(err);
			}				
		}else{
            let err = new Error('Comment ' + req.params.commentId + ' not found!');
            err.statusCode = 404;
            next(err);
        }	
	}, (err) => next(err))
	.catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
	Comments.findById(req.params.commentId)
	.then((comment) => {
		if(comment != null){	

			// current user is the owner of the comment to delete
			if(comment.author.equals(req.user._id)){
				Comments.findByIdAndDelete(req.params.commentId)		
				.then((dish) => {
					Dishes.findById(dish._id).populate('comments.author')
					.then((resp) => {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.json(resp);
					})
				}, (err) => next(err))
                .catch(err => next(err));
			}
			else{
				let err = new Error("Your are not authorised to delete this comment!");
				err.status = 403;
				next(err);
			}			
		}		
		else{
			err = new Error('Comment '+ req.params.commentId + ' not found');
			err.status = 404;
			return next(err);
		}	
	}, (err) => next(err))
	.catch((err) => next(err));
});

module.exports = commentRouter;