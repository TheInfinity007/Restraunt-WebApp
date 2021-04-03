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
                .then(newFavorite => {
                    console.log("Favorite created = ", newFavorite);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(newFavorite);
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
                    .then(newFavorite => {
                        console.log("Favorites updated = ", newFavorite);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(newFavorite);
                    }, err => next(err))
                    .catch(err => next(err))
                }, err => next(err))
                .catch(err => next(err))
            }
        }, err => next(err)) 
        .catch(err => next(err));           
    }else{
        res.statusCode = 404;
        res.end('No items found!');    
    }
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 405;
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
    res.statusCode = 405;
	res.end('GET operation not suppported on /favorites/' + req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    
    Favorites.findOne({ user: req.user._id})
    .then(favorite => {
        // Check whether dish already exist in favorites
        if(favorite){           
            if(favorite.dishes.indexOf(req.params.dishId) != -1){
                console.log("Item already in favorites");
                res.statusCode = 304;
                res.end("Item already in favorites");
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
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                // if the favorite does not exist create a favorite
                if(!favorite){                                                
                    Favorites.create({ user: req.user._id, dishes: [dish._id] })
                    .then(newFavorite => {
                        console.log("Favorite created = ", newFavorite);
                        res.json(newFavorite);
                    }, err => next(err)) 
                    .catch(err => next(err));                   
                }
                else{
                    favorite.dishes.push(dish._id);
                    favorite.save()
                    .then(newFavorite => {
                        console.log("Item added to favorites! = ", newFavorite);
                        res.statusCode = 200;
                        res.json(newFavorite);
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
                    console.log("Dish ", req.params.dishId, " removed from favorites! = ", favorite);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                }, err => next(err))
                .catch(err => next(err))
            }else{
                console.log("Item don't exist in favorites!");
                res.statusCode = 404;
                res.end("Item don't exist in favorites!");
            }
        }else{
            console.log("You don't have any favorites!");
            res.statusCode = 404;
            res.end("You don't have any favorites!");
        }
    }, (err) => next(err))
    .catch(err => next(err));
});



module.exports = favoriteRouter;