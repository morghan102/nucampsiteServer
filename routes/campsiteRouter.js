const express = require('express');
const Campsite = require('../models/campsite');
const authenticate = require('../authenticate'); //we removed authentication from app.js, so adding the verifyUser to auth will do this here instd
const cors = require('./cors');

const campsiteRouter = express.Router();


//in serverjs, these methods were DEFINED SEPERATELY, BUT IN here they are chained
//and in here, we dont need to include the path of '/campsites' bc itsalready defined above
campsiteRouter.route('/')
    //opts is for preflight req. not always sent
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200)) //remem that corswopts checks if theyre inthe whitelisted origins
    // all removed for mongoose or mongo, idk which, so we can set that stuff for ea endpt
    // .all((req, res, next) => {
    //     res.statusCode = 200;
    //     res.setHeader('Content-Type', 'text/plain');
    //     next();
    // })
    .get(cors.cors, (req, res, next) => {
        Campsite.find()
            .populate('comments.author')// populate auth field of comments subdoc by finding the user doc that matches the objId thats stored there
            .then(campsites => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsites);//this meth will send json data to the client in the response stream and auto close response stram afterwards.

            })
            // res.end('Will send all the campsites to you'); can delete this bc res.json(cs) method auto closes stream and we dont need end
            .catch(err => next(err)); //passes off error to overall error handler
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { //must be authnenticated to access any of these endpts
        Campsite.create(req.body) //body will have the campsite info from the clienyt. express json middleware will have already parsed it into a format we can work w
            //thru the create method, mongoose will already have checked that the info fits the schema we defined
            .then(campsite => {
                console.log('Campsite Created ', campsite);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
            })
            .catch(err => next(err));

    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /campsites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Campsite.deleteMany()
            .then(response => {// response will hold info abt how many docs were deleted
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));

    });





campsiteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    // .all((req, res, next) => {
    //     res.statusCode = 200;
    //     res.setHeader('Content-Type', 'text/plain');
    //     next();
    // })
    .get(cors.cors, (req, res, next) => {
        Campsite.findById(req.params.campsiteId)
            .populate('comments.author')
            .then(campsite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
            })
            .catch(err => next(err));
        // res.end(`Will send ${req.params.campsiteId} campsite to you.`);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Campsite.findByIdAndUpdate(req.params.campsiteId, {
            $set: req.body
        }, { new: true })
            .then(campsite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
            })
            .catch(err => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Campsite.findByIdAndDelete(req.params.campsiteId)
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));
    });



campsiteRouter.route('/:campsiteId/comments')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))

    .get(cors.cors, (req, res, next) => {
        Campsite.findById(req.params.campsiteId)
            .populate('comments.author')
            .then(campsite => {
                if (campsite) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(campsite.comments);
                } else {
                    err = new Error(`Campsite ${req.params.campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { //when the comm is sent to the server from client, itll be sent in the body
        Campsite.findById(req.params.campsiteId)
            .then(campsite => {
                if (campsite) {
                    req.body.author = req.user._id; //ensures that the user's id is saved in author field so we can keep track of who posts what
                    campsite.comments.push(req.body);
                    campsite.save()
                        .then(campsite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(campsite);
                        })
                        .catch(err => next(err));
                } else {
                    err = new Error(`Campsite ${req.params.campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /campsites/${req.params.campsiteId}/comments`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Campsite.findById(req.params.campsiteId)
            .then(campsite => {
                if (campsite) {
                    for (let i = (campsite.comments.length - 1); i >= 0; i--) {
                        campsite.comments.id(campsite.comments[i]._id).remove();
                    }
                    campsite.save()
                        .then(campsite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(campsite);
                        })
                        .catch(err => next(err));
                } else {
                    err = new Error(`Campsite ${req.params.campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    });

campsiteRouter.route('/:campsiteId/comments/:commentId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Campsite.findById(req.params.campsiteId)
            .populate('comments.author')
            .then(campsite => {
                if (campsite && campsite.comments.id(req.params.commentId)) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(campsite.comments.id(req.params.commentId));
                } else if (!campsite) {
                    err = new Error(`Campsite ${req.params.campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`Comment ${req.params.commentId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
    })
    .put(authenticate.verifyUser, (req, res, next) => {
        Campsite.findById(req.params.campsiteId)
            .then(campsite => {
                // if (req.user._id === req.params.commentId)
                if (campsite && campsite.comments.id(req.params.commentId)) { //finds the campsite comment
                    if((campsite.comments.id(req.params.commentId).author._id).equals(req.user._id)) {//checks if author of the comment is the same as the one trying to change it
                        if (req.body.rating) {
                            campsite.comments.id(req.params.commentId).rating = req.body.rating;
                        }
                        if (req.body.text) {
                            campsite.comments.id(req.params.commentId).text = req.body.text;
                        }
                        campsite.save()
                            .then(campsite => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(campsite);
                            })
                            .catch(err => next(err));
                    } else {
                        err = new Error("You are not the author of this comment");
                        err.status = 403;
                        return next(err);
                    }
                } else if (!campsite) {
                    err = new Error(`Campsite ${req.params.campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`Comment ${req.params.commentId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .delete(authenticate.verifyUser, (req, res, next) => {
        Campsite.findById(req.params.campsiteId)
            .then(campsite => {
                if (campsite && campsite.comments.id(req.params.commentId)) {
                    if((campsite.comments.id(req.params.commentId).author._id).equals(req.user._id)) { //checks if author of the comment is the same as the one trying to change it
                    campsite.comments.id(req.params.commentId).remove();
                    campsite.save()
                        .then(campsite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(campsite);
                        })
                        .catch(err => next(err));
                    } else {
                        err = new Error("You are not the author of this comment");
                        err.status = 403;
                        return next(err);
                    }
                } else if (!campsite) {
                    err = new Error(`Campsite ${req.params.campsiteId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`Comment ${req.params.commentId} not found`);
                    err.status = 404;
                    return next(err);
                }

            })
            .catch(err => next(err));
    });


module.exports = campsiteRouter;