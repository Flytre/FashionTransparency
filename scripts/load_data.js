const express = require('express');
const https = require("https");
const router = express.Router({strict: true})

const fs = require('fs'); 
const { parse } = require('csv-parse');
const path = require('path');


let dataLoaded = false
let data = {}

function loadData(dataCallback) {

let transparencyData = {}

fs.readdir("./data", function (err, files) {

    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    let targetCount = files.length;
    let currentCount = 0;
    //listing all files using forEach
    files.forEach(function (file) {

        load(file, record => {
            transparencyData[file.replace(".csv","")] = record
            currentCount += 1 //dangerous call
            if(currentCount == targetCount) {
                data = transparencyData
                dataLoaded = true
                if(dataCallback !== undefined)
                dataCallback(data)
            }
        })
    });
})
}

function getData(callback) {
    if(!dataLoaded) {
        loadData(callback)
    } else {
        callback(data)
    }
}

async function load(name, recordConsumer) {
    const parser = parse({columns: true}, function (err, records) {
	recordConsumer(records)
});
    fs.createReadStream(`./data/${name}`).pipe(parser);
}

module.exports.router = router;
module.exports.getData = getData