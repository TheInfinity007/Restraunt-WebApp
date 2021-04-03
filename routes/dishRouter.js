const express = require('express');
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Dishes = require('../models/dishes');

const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

dishRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
	Dishes.find(req.query).populate('comments.author')
	.then((dishes) => {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.json(dishes);
	}, (err) => next(err))
	.catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	Dishes.create(req.body)
	.then((dish) => {
		console.log('Dish Created ', dish);
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.json(dish);
	}, (err) => next(err))
	.catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	res.statusCode = 403;
	res.end('PUT operation not suppported on /dishes');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	Dishes.remove({})
	.then((resp) => {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.json(resp);
	}, (err) => next(err))
	.catch((err) => next(err));
});

dishRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
	Dishes.findById(req.params.dishId).populate('comments.author')
	.then((dish) => {		
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.json(dish);
	}, (err) => next(err))
	.catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	res.statusCode = 403;
	res.end('POST operation not suppported on /dishes/' + req.params.dishId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	Dishes.findByIdAndUpdate(req.params.dishId, {
		$set: req.body
	}, { new: true })
	.then((dish) => {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.json(dish);
	}, (err) => next(err))
	.catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	Dishes.findByIdAndRemove(req.params.dishId)
	.then((resp) => {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.json(resp);
	}, (err) => next(err))
	.catch((err) => next(err));
});


dishRouter.route('/:dishId/comments')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
	Dishes.findById(req.params.dishId).populate('comments.author')
	.then((dish) => {
		if(dish != null){
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.json(dish.comments);
		}
		else{
			err = new Error('Dish '+ req.params.dishId + ' not found');
			err.status = 404;
			return next(err);
		}
		
	}, (err) => next(err))
	.catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
	// Find the dishes using the id from the params
	Dishes.findById(req.params.dishId)
	.then((dish) => {
		if(dish != null){
			// add the author field to the comment using the req.user as it is not in the req.body
			req.body.author = req.user._id;
			dish.comments.push(req.body);
			dish.save()
			.then((dish) => {
				Dishes.findById(dish._id).populate('comments.author')
				.then((dish) => {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(dish);
				})
			}, (err) => next(err));
		}
		else{
			err = new Error('Dish '+ req.params.dishId + ' not found');
			err.status = 404;
			return next(err);
		}
	}, (err) => next(err))
	.catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	res.statusCode = 403;
	res.end('PUT operation not suppported on /dishes/' + req.params.dishId + '/comments');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	Dishes.findById(req.params.dishId)
	.then((dish) => {
		if(dish != null){	

			// delete each subdocument (delete all comments of a particular dish)
			for(let i = dish.comments.length-1; i >= 0; i--){
				dish.comments.id(dish.comments[i]._id).remove();
			}
			dish.save()
			.then((dish) => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(dish);
			}, (err) => next(err));
		}
		else{
			err = new Error('Dish '+ req.params.dishId + ' not found');
			err.status = 404;
			return next(err);
		}
	}, (err) => next(err))
	.catch((err) => next(err));
});

dishRouter.route('/:dishId/comments/:commentId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
	Dishes.findById(req.params.dishId).populate('comments.author')
	.then((dish) => {
		if(dish != null && dish.comments.id(req.params.commentId) != null){
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.json(dish.comments.id(req.params.commentId));
		}
		else if(dish == null){
			err = new Error('Dish '+ req.params.dishId + ' not found');
			err.status = 404;
			return next(err);
		}
		else{
			err = new Error('Comment '+ req.params.commentId + ' not found');
			err.status = 404;
			return next(err);
		}		
	}, (err) => next(err))
	.catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	res.statusCode = 403;
	res.end('POST operation not suppported on /dishes/' + req.params.dishId + '/comments/' + req.params.commentId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
	Dishes.findById(req.params.dishId)
	.then((dish) => {
		// Dish and comment both exist in DB
		if(dish != null && dish.comments.id(req.params.commentId) != null){

			let comment = dish.comments.id(req.params.commentId);
			// current user is the owner of the comment to update
			if(comment.author.equals(req.user._id)){
				if(req.body.rating){
					dish.comments.id(req.params.commentId).rating = req.body.rating;
				}
				if(req.body.comment){
					dish.comments.id(req.params.commentId).comment = req.body.comment;
				}
				dish.save()
				.then((dish) => {
					// sending back the dish with comments and the author(populate)
					Dishes.findById(dish._id).populate('comments.author')
					.then((dish) => {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.json(dish.comments.id(req.params.commentId));
					})
				}, (err) => next(err));
			}
			else{
				let err = new Error("Your are not authorised to update this comment!");
				err.status = 403;
				next(err);
			}				
		}
		else if(dish == null){
			err = new Error('Dish '+ req.params.dishId + ' not found');
			err.status = 404;
			return next(err);
		}
		// Dish Exist but Comment not exist
		else{
			err = new Error('Comment '+ req.params.commentId + ' not found');
			err.status = 404;
			return next(err);
		}		
	}, (err) => next(err))
	.catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
	Dishes.findById(req.params.dishId)
	.then((dish) => {
		if(dish != null && dish.comments.id(req.params.commentId) != null){	

			let comment = dish.comments.id(req.params.commentId);
			// current user is the owner of the comment to delete
			if(comment.author.equals(req.user._id)){
				dish.comments.id(req.params.commentId).remove();
				dish.save()
				.then((dish) => {
					Dishes.findById(dish._id).populate('comments.author')
					.then((dish) => {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.json(dish);
					})
				}, (err) => next(err));
			}
			else{
				let err = new Error("Your are not authorised to delete this comment!");
				err.status = 403;
				next(err);
			}
			
		}
		else if(dish == null){
			err = new Error('Dish '+ req.params.dishId + ' not found');
			err.status = 404;
			return next(err);
		}
		// Dish Exist but Comment not exist
		else{
			err = new Error('Comment '+ req.params.commentId + ' not found');
			err.status = 404;
			return next(err);
		}	
	}, (err) => next(err))
	.catch((err) => next(err));
});

module.exports = dishRouter;