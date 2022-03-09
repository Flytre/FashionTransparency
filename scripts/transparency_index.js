const express = require('express');
const https = require("https");
const router = express.Router({strict: true})


const {getData} = require('./load_data.js')

router.get('/transparency_index', (req, res) => {
    //if the parameter is undefined, it defaults to total
    let tableName = req.query.table || "total";

    getData(data => {

        let totalPoints = 200;
        let xAxis = []; //stores the x value for each brand
        let yAxis = []; //stores the y value for each brand
        let bubbleSize = []; //stores the bubble size for each brand
        let table = data[tableName];
        let graphTitle = "Total Points";

        //fill the above arrays
        for (const rowIndex in table) {

            let row = table[rowIndex];
            let headers = Object.keys(row);

            xAxis.push(row['Brand Name'])
            yAxis.push(row[headers[headers.length - 1]]) //value of last key in row, the total points
            bubbleSize.push((row[headers[headers.length - 1]] / totalPoints) * 100)  //scale bubble size
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
                    marker: {
                        size: bubbleSize
                    }
                }],
                "layout": {
                    title: graphTitle,
                    showlegend: false,
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