const express = require('express');
const https = require("https");
const router = express.Router({strict: true})

const fs = require('fs');
const {parse} = require('csv-parse');
const path = require('path');


let dataLoaded = false
let data = {}

function loadData(dataCallback) {

    let transparencyData = {}

//read the data directory and load all the files inside of it
    fs.readdir("./data", function (err, files) {

        //handle an i/o errors
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }


        let targetCount = files.length;
        let currentCount = 0;


        //iterate through all files in the data folder
        files.forEach(function (file) {

            //attempt to load and parse the file contents to the transparencyData global variable, which holds
            //all the file data
            load(file, record => {
                transparencyData[file.replace(".csv", "")] = record

                currentCount += 1 //dangerous call

                if (currentCount == targetCount) {
                    data = transparencyData

                    //once all the data is loaded, update the variable and run any custom behavior
                    dataLoaded = true

                    if (dataCallback !== undefined)
                        dataCallback(data)
                }
            })
        });
    })
}

//sends all the file data to the callback function as a parameter
function getData(callback) {
    if (!dataLoaded) {
        loadData(callback)
    } else {
        callback(data)
    }
}

//asynchronously loads the actual data from a file and runs a callback once loaded
async function load(name, recordConsumer) {
    const parser = parse({columns: true}, function (err, records) {
        recordConsumer(records)
    });
    fs.createReadStream(`./data/${name}`).pipe(parser);
}

module.exports.router = router;
module.exports.getData = getData