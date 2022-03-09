const express = require('express');
const https = require("https");
const router = express.Router({strict: true})


const {getData} = require('./load_data.js')
const {seededRandom} = require('./seeded_random.js')


function createColor(red, green, blue) {
    return `rgb(${red},${green},${blue},0.5)`
}

function randomColor(rndInt) {
    return createColor(0, rndInt(64, 192), rndInt(64, 192))
}

router.get('/transparency_index', (req, res) => {
    //if the parameter is undefined, it defaults to total
    let tableName = req.query.table || "total";

    getData(data => {

        let totalPoints = 200;
        let xAxis = []; //stores the x value for each brand
        let yAxis = []; //stores the y value for each brand
        let bubbleSize = []; //stores the bubble size for each brand
        let colors = []; //stores the color of each bubble
        let table = data[tableName];
        let names = [];
        let graphTitle = "Total Points";

        //fill the above arrays
        for (const rowIndex in table) {

            let row = table[rowIndex];
            let headers = Object.keys(row);
            let score = row[headers[headers.length - 1]]

            const {rnd, rndInt, shuffle} = seededRandom({seed: "" + row['Brand Name']});


            xAxis.push(rnd(0, 100))
            yAxis.push(rnd(0, 100))
            names.push(row['Brand Name'] + '<br>Transparency Rating: ' + score)
            bubbleSize.push(((score / totalPoints) * 100))  //scale bubble size
            colors.push(randomColor(rndInt))
        }

        //set the graph title
        if (tableName !== "total") {
            for (const rowIndex in data["section_to_name"]) {
                if (data["section_to_name"][rowIndex]['Section'] == tableName) {
                    graphTitle = data["section_to_name"][rowIndex];
                }
            }
            graphTitle = data["section_to_name"]
        }

        res.render("transparency_index", {
            "data": data["total"],
            "section_name": data["section_to_name"],
            "graph": JSON.stringify({
                "data": [{
                    x: xAxis,
                    y: yAxis,
                    mode: 'markers',
                    text: names,
                    marker: {
                        size: bubbleSize,
                        color: colors
                    }
                }],
                "layout": {
                    title: graphTitle,
                    showlegend: false,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    xaxis: {
                        showgrid: false,
                        automargin: true,
                        zeroline: false,
                        visible: false
                    },
                    yaxis: {
                        showgrid: false,
                        automargin: true,
                        zeroline: false,
                        visible: false

                    },
                    autosize: false,
                    width: 1000,
                    height: 1000
                }
            })
        })
    })
})

router.get('/table_data', (req, res) => {
    let table = req.query.table;

    if (table === undefined) {
        table = "total"
    }

    getData(data => {
        res.render("table_visualizer", {
            "data": data[table]
        })
    })
})

router.get('/compare_chart', (req, res) => {
    const {brand_1, brand_2, category} = req.query;

    let brand1Data, brand2Data;
    const customTable = []; //stores a custom table constructed using the given query parameters

    if (category === "" || category === undefined) {
        res.render("selection_error")
    }

    getData(data => {
        let table = data[category];

        //selects correct brands and corresponding data
        for (const row_index in table) {
            if (table[row_index]['Brand Name'] === brand_1) {
                brand1Data = table[row_index];
            } else if (table[row_index]['Brand Name'] === brand_2) {
                brand2Data = table[row_index];
            }
        }

        if (brand1Data === undefined || brand2Data === undefined) {
            res.render("selection_error")
        }

        let headers = Object.keys(brand1Data)

        headers.forEach(header => {
            customTable.push([header, brand1Data[header], brand2Data[header]])
        })

        res.render("compare_table", {
            "data": customTable
        })
    })
})

module.exports = router;