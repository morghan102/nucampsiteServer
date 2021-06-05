const express = require('express');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res, next) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.find({ user: req.user._id })
            .populate('user')
            .populate('campsites')
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        //i think this is wrong
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                if (favorite) {
                    req.body.forEach(fave => {
                        if (!favorite.campsites.includes(fave._id)) {
                            favorite.campsites.push(fave._id);
                        }
                    });
                    favorite.save()//always need to save if changing the doc, not if creating tho
                        .then(favorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        }).catch(err => next(err));

                } else {
                    Favorite.create({ user: req.user._id }) //need ro look for the id and cant just create using the req.body bc we're doing smth w (giving? or whats in the body) an arr of IDs
                        .then(favorite => {
                            req.body.forEach(fav => {
                                if (!favorite.campsites.includes(fav._id)) {
                                    favorite.campsites.push(fav._id)
                                }
                            });
                            favorite.save()
                                .then(favorite => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(favorite);
                                })
                                .catch(err => next(err));
                        })
                        .catch(err => next(err));

                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /favorites`)
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOneAndDelete({ user: req.user._id })
            .then(favorite => {
                res.statusCode = 200;
                if (favorite) {
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                } else {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('You do not have any favorites to delete.');
                }

            })
            .catch(err => next(err));
    });


favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        res.statusCode = 403;
        res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        //i think this is wrong
        Favorite.findOne({ user: req.user._id })
            .then(favorite => { //returns the whole document right?
                if (favorite) {
                    if (!favorite.campsites.includes(req.params.campsiteId)) {
                        favorite.campsites.push(req.params.campsiteId);
                        favorite.save()
                        .then(favorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                    } else {
                        res.statusCode = 200; //this isnt the right statuscode
                        res.setHeader('Content-Type', 'text/plain');
                        res.end("That campsite is already in the list of favorites!");
                    }
                } else {
                    Favorite.create({ user: req.user._id, campsites: [req.params.campsiteId] })
                        .then(favorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`)
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                // res.statusCode = 200;
                if (favorite) {
                    const idx = favorite.campsites.indexOf(req.params.campsiteId);//idx of the ele. if it doesnt exist, idxOf returns -1
                    if (idx >= 0) {
                        favorite.campsites.splice(idx, 1);
                    }
                    favorite.save()
                        .then(favorite => {
                            console.log('Favorite Campsite Deleted!', favorite);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        }).catch(err => next(err));
                } else {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('You do not have any favorites to delete.');
                }

            }).catch(err => next(err))
    });


module.exports = favoriteRouter;