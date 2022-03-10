const express = require('express');
const https = require("https");
const router = express.Router({strict: true})


const {getData} = require('./load_data.js')

router.get('/test', (req, res) => {
    var table = req.query.table;
    if (table === undefined) {
        table = "total"
    }

    getData(data => {
        var total_points = 200;
        var x_axis = [];
        var y_axis = [];
        var bubble_size = [];
        for (const i in data[table]) {  //for each brand
            x_axis.push(data[table][i]['Brand Name'])   //array of brand names in alphabetical order
            //console.log(data[table][i][Object.keys(data[table][i])[Object.keys(data[table][i]).length-1]])
            y_axis.push(data[table][i][Object.keys(data[table][i])[Object.keys(data[table][i]).length - 1]])      //array of total score in section, index corresponds to x_axis index
            bubble_size.push((data[table][i][Object.keys(data[table][i])[Object.keys(data[table][i]).length - 1]] / total_points) * 100)  //scales bubble size
        }
        console.log(x_axis)
        var trace1 = {
            x: x_axis,
            y: y_axis,
            mode: 'markers',
            marker: {
                size: bubble_size
            }
        };

        var graph_data = [trace1];

        var graph_title = "Total Points";
        if (table !== "total") {
            for (const i in data["section_to_name"]) {
                if (data["section_to_name"][i]['Section'] == table) {
                    graph_title = data["section_to_name"][i];
                }
            }
            graph_title = data["section_to_name"]
        }
        var layout = {
            title: graph_title,
            showlegend: false,
            height: 600,
            width: 600
        };
        console.log({
            "data": graph_data,
            "layout": layout
        })
        //Plotly.newPlot('data_table_container', graph_data, layout);
        res.render("test", {
            "data": data["total"],
            "section_name": data["section_to_name"],
            "graph": JSON.stringify({
                "data": graph_data,
                "layout": layout
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
    var b1, b2;
    var new_data = [];
    if (category !== null) {
        getData(data => {
            for (const i in data[category]) {
                if (brand_1 !== null && data[category][i]['Brand Name'] == brand_1) {
                    b1 = data[category][i];
                } else if (brand_2 !== null && data[category][i]['Brand Name'] == brand_2) {
                    b2 = data[category][i];
                }
            }
            for (const i in Object.keys(data[category][0])) {
                var temp = [Object.keys(data[category][0])[i]];
                if (b1 !== null) {
                    temp.push(b1[Object.keys(data[category][0])[i]])
                } else {
                    temp.push("")
                }
                if (b2 !== null) {
                    temp.push(b2[Object.keys(data[category][0])[i]])
                } else {
                    temp.push("")
                }
                new_data.push(temp)
            }
            res.render("compare_table", {
                "data": new_data
            })
        })
    }
})

module.exports = router;