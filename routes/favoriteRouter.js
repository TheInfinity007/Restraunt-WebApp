const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorites');
const Dishes = require('../models/dishes');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {

    Favorites.findOne({ user: req.user._id }).populate('user').populate('dishes')
    .then(favorite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite)
    }, (err) => next(err))
    .catch(err => next(err))
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    if(req.body && req.body.length > 0){
        let dishIds = new Set(req.body.map((item) => {
            return item['_id'];
        }));
        console.log(dishIds);   

        let dishes = [];
        dishIds.forEach((dishId) => dishes.push(dishId));

        Favorites.findOne({ user: req.user._id})
        .then(favorite => {
            if(!favorite){
                Favorites.create({ user: req.user._id, dishes: dishes })
                .then(favorite => {
                    Favorites.findById(favorite._id).populate('user').populate('dishes')
                    .then(favorite => {
                        console.log("Favorite created = ", favorite);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    }, err => next(err))
                    .catch(err => next(err))                    
                }, err => next(err)) 
                .catch(err => next(err)); 
            }
            else{
                Dishes.find({ _id: { $in: dishes }}, {_id: 1})
                .then(dishes => {
                    console.log(dishes)
                    for(let i = 0; i < dishes.length; i++){
                        let id = dishes[i]["_id"];
                        if(favorite.dishes.indexOf(id) === -1){
                            favorite.dishes.push(id);
                        }
                    }
                    favorite.save()
                    .then(favorite => {
                        Favorites.findById(favorite._id).populate('user').populate('dishes')
                        .then(favorite => {
                            console.log("Favorites updated = ", favorite);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        }, err => next(err))
                        .catch(err => next(err))
                    }, err => next(err))
                    .catch(err => next(err))
                }, err => next(err))
                .catch(err => next(err))
            }
        }, err => next(err)) 
        .catch(err => next(err));           
    }else{
        let err = new Error('Dishes not found in request body');
        err.statusCode = 404;
        next(err);
    }
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'text/plain');
	res.end('PUT operation not suppported on /favorites/');  
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
   Favorites.deleteOne({ user: req.user._id})
   .then(resp => {
        console.log("Favorite Deleted = ", resp);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
   }, err => next(err))
   .catch(err => next(err));
})

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id})
    .then(favorite => {
        if(!favorite){
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({ "exists": false, "favorites": favorite })
        }else{
            if(favorite.dishes.indexOf(req.params.dishId) !== -1){
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({ "exists": true, "favorites": favorite })
            }
            else{
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({ "exists": false, "favorites": favorite })
            }
        }
    }, (err) => next(err))
    .catch(err => next(err))
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    
    Favorites.findOne({ user: req.user._id})
    .then(favorite => {
        // Check whether dish already exist in favorites
        if(favorite){           
            if(favorite.dishes.indexOf(req.params.dishId) != -1){
                console.log("Item already in favorites");
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Dish ' + req.params.dishId + ' already exists in favorites');
                return;
            }
        }

        // Find the dish from the database
        Dishes.findById(req.params.dishId)
        .then(dish => {
            if(!dish){
                let err = new Error('Dish '+ req.params.dishId + ' not found');
			    err.status = 404;
			    return next(err);
            }else{
                console.log("Dish Exist");
                // if the favorite does not exist create a favorite
                if(!favorite){                                                
                    Favorites.create({ user: req.user._id, dishes: [dish._id] })
                    .then(favorite => {
                        Favorites.findById(favorite._id).populate('user').populate('dishes')
                        .then(favorite => {
                            console.log("Favorites created = ", favorite);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        }, err => next(err))
                        .catch(err => next(err))
                    }, err => next(err)) 
                    .catch(err => next(err));                   
                }
                else{
                    favorite.dishes.push(dish._id);
                    favorite.save()
                    .then(favorite => {
                        Favorites.findById(favorite._id).populate('user').populate('dishes')
                        .then(favorite => {
                            console.log("Item added to favorites! = ", favorite);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        }, err => next(err))
                        .catch(err => next(err))
                    }, (err) => next(err))
                    .catch(err => next(err));
                }
            }
        }, err => next(err))
        .catch(err => next(err))
    }, (err) => next(err))
    .catch(err => next(err)); 
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'text/plain');
	res.end('PUT operation not suppported on /favorites/' + req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id})
    .then(favorite => {
        // Check whether dishId exist in favorites
        if(favorite){
            let index = favorite.dishes.indexOf(req.params.dishId);
            if(index !== -1){
                favorite.dishes.splice(index, 1);
                favorite.save()
                .then(favorite => {
                    Favorites.findById(favorite._id).populate('user').populate('dishes')
                    .then(favorite => {
                        console.log("Dish ", req.params.dishId, " removed from favorites! = ", favorite);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    }, err => next(err))
                    .catch(err => next(err))
                }, err => next(err))
                .catch(err => next(err))
            }else{
                console.log("Item don't exist in favorites!");
                let err = new Error('Dish ' + req.params.dishId + ' not found in your favorites!');
                err.statusCode = 404;
                next(err);
            }
        }else{
            console.log("You don't have any favorites!");
            let err = new Error('Dish ' + req.params.dishId + ' not found in your favorites!');
            err.statusCode = 404;
            next(err);
        }
    }, (err) => next(err))
    .catch(err => next(err));
});



module.exports = favoriteRouter;