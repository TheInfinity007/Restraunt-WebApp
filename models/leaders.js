const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const leaderSchema = new Schema({
    name: { type: String, require: true, unique: true },
    image: { type: String, require: true},
    designation: { type: String, require: true},
    abbr: { type: String},
    description: { type: String, required: true }
}, {
    timestamps: true
});

var Leaders = mongoose.model('Leader', leaderSchema);
module.exports = Leaders;
