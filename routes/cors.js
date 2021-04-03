const express = require('express');
const cors = require('cors');
const app = express();

// contains origins that the server willing to accept
const whitelist = ['http://localhost:3000', 'https://localhost:3443', 'http://localhost:3001', 'http://RAM:3001'];
var corsOptionsDelegate = (req, callback) => {
    var corsOptions;
    console.log("Origin = ", req.header('Origin'));
    if(whitelist.indexOf(req.header('Origin')) !== -1){
        corsOptions = { origin: true }
    }
    else{
        corsOptions = { origin: false }
    }
    callback(null, corsOptions);
}

exports.cors = cors();
exports.corsWithOptions = cors(corsOptionsDelegate);

