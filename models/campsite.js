// defining the mongoose Schema and model for all docs in the dv campsite collection
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

require('mongoose-currency').loadType(mongoose);
const Currency = mongoose.Types.Currency;


const commentSchema = new Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId, //uses mongoose population. reference to User doc
        ref: 'User' //name of the Model for this doc

        // type: String,
        // required: true
    }
}, { //opt
    timestamps: true //mongoose will do the createdAt & updatedAt timestamps
});


const campsiteSchema = new Schema({
    // 1st arg is required. obj that contains the definition for this schema
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    elevation: {
        type: Number,
        required: true
    },
    cost: {
        type: Currency,
        required: true,
        min: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    comments: [commentSchema] //so ea campsiteSchema will be able to store multi comments schemas in an arr
}, { //opt
    timestamps: true //auto adds 2 properties to this schemA: createdAt ad updatedAt w times
});

const Campsite = mongoose.model('Campsite', campsiteSchema); //model name Campsite. thisis the name of the collection, it will look for the low-case plural version of this name
//2nd arg is the schema we want to use for this collection

module.exports = Campsite;