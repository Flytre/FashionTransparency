const express = require('express');
const router = express.Router({strict: true})


const {getData} = require('./load_data.js')
const {seededRandom} = require('./seeded_random.js')


function createColor(red, green, blue) {
    return `rgb(${red},${green},${blue},0.5)`
}

function randomColor(percent) {

    function hsv2rgb(h, s, v) {
        let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
        return [f(5), f(3), f(1)];
    }

    let rgb = hsv2rgb(percent * (225 - 135) + 135, 0.9, 0.5)

    return createColor(rgb[0] * 256, rgb[1] * 256, rgb[2] * 256)
}

router.get('/transparency_graph', (req, res) => {
    //if the parameter is undefined, it defaults to total
    let tableName = req.query.table || "total";

    getData(data => {

        let xAxis = []; //stores the x value for each brand
        let yAxis = []; //stores the y value for each brand
        let bubbleSize = []; //stores the bubble size for each brand
        let colors = []; //stores the color of each bubble
        let table = data[tableName];
        let names = [];
        let border_width = [];
        let border_color = [];
        let customData = {};
        let graphTitle = "Total Points";
        let annotations = [];

        let maxPoints = parseInt( //the maximum score any brand has
            table.map(brand => {
                let headers = Object.keys(brand);
                return brand[headers[headers.length - 1]] //get the total score of the brand
            }).reduce((currentMax, contender) => {
                return parseInt(currentMax) > parseInt(contender) ? currentMax : contender //reduce to the max score
            }))
        let {q, requirements, min, max} = req.query;
        if (min === undefined || min === "") {
            min = 0
        }
        if (max === undefined || max === "") {
            max = maxPoints
        }
        if (requirements === undefined) {
            requirements = []
        } else if (!Array.isArray(requirements) && requirements.includes('"')) {
            requirements = JSON.parse(requirements)
        }
        //fill the above arrays
        for (const rowIndex in table) {

            let row = table[rowIndex];
            let headers = Object.keys(row);
            let score = row[headers[headers.length - 1]]

            //what's happening here is the creation of a seeded random function
            //that means if the same seed is passed in the same sequence of random values will always follow
            //this allows the positions of all the dots to be arbitrary but not change
            const {rnd, rndInt} = seededRandom({seed: "" + row['Brand Name']});

            let acceptable = true

            if (parseFloat(score) >= min && parseFloat(score) <= max) {

                if (Array.isArray(requirements)) {
                    for (const header in requirements) {
                        if (parseFloat(row[requirements[header]]) === 0.0) {
                            acceptable = false
                        }
                    }
                } else if (parseFloat(row[requirements]) === 0.0) {
                    acceptable = false
                }

                if (acceptable) {
                    xAxis.push(rnd(0, 100))
                    yAxis.push(rnd(0, 100))

                    let displayName = row['Brand Name'] + '<br>Transparency Rating: ' + score;

                    names.push(displayName)
                    bubbleSize.push(((score / maxPoints) * 100) + 20)  //scale bubble size
                    colors.push(randomColor(rnd(0, 1)))
                    if (q !== undefined && removePunctuation(row['Brand Name']).toLowerCase() === q.toLowerCase()) {
                        border_width.push(5)
                        border_color.push('red')
                    } else {
                        border_width.push(0)
                        border_color.push('white')
                    }
                    customData[displayName] = {
                        "brand": row['Brand Name']
                    }
                    annotations.push({
                        x: xAxis[xAxis.length - 1],
                        y: yAxis[yAxis.length - 1],
                        xref: 'x',
                        yref: 'y',
                        text: row['Brand Name'],
                        xanchor: 'center',
                        yanchor: 'middle',
                        showarrow: false,
                        font: {
                            color: '#bababa',
                            size: Math.max(8, Math.floor((bubbleSize[bubbleSize.length - 1] / row['Brand Name'].length) * 1.25))
                        }
                    })
                }
            }
        }

        //set the graph title
        if (tableName !== "total") {
            for (const rowIndex in data["section_to_name"]) {
                if (data["section_to_name"][rowIndex]['Section'] === tableName) {
                    graphTitle = data["section_to_name"][rowIndex]['Title'];
                }
            }
            //graphTitle = data["section_to_name"]
        }

        res.json({
            "data": [{
                x: xAxis,
                y: yAxis,
                mode: 'markers',
                text: names,
                marker: {
                    size: bubbleSize,
                    color: colors,
                    line: {
                        color: border_color,
                        width: border_width
                    }
                },
                customData: customData //custom property so we can access brand names on the client
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
                margin: {
                    t: 35, //top margin
                    l: 20, //left margin
                    r: 20, //right margin
                    b: 20 //bottom margin
                },
                annotations: annotations
            }
        })
    })
})


router.get('/transparency_index', (req, res) => {
    //if the parameter is undefined, it defaults to total
    let tableName = req.query.table || "total";

    getData(data => {

        let table = data[tableName];
        let graphTitle = "Total Points";

        let maxPoints = parseInt( //the maximum score any brand has
            table.map(brand => {
                let headers = Object.keys(brand);
                return brand[headers[headers.length - 1]] //get the total score of the brand
            }).reduce((currentMax, contender) => {
                return parseInt(currentMax) > parseInt(contender) ? currentMax : contender //reduce to the max score
            }))

        //set the graph title
        if (tableName !== "total") {
            for (const rowIndex in data["section_to_name"]) {
                if (data["section_to_name"][rowIndex]['Section'] === tableName) {
                    graphTitle = data["section_to_name"][rowIndex]['Title'];
                }
            }
        }

        res.render("transparency_index", {
            "data": data[tableName],
            "section_name": data["section_to_name"],
            "max": maxPoints,
            "min": 0,
            "table": tableName,
            "title": graphTitle
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

    const customTable = []; //stores a custom table constructed using the given query parameters

    if (category === "" || category === undefined) {
        res.render("selection_error")
    } else {
        getData(data => {

            let brand1Data = data[category].find(e => e['Brand Name'] === brand_1)
            let brand2Data = data[category].find(e => e['Brand Name'] === brand_2)

            if (brand1Data === undefined || brand2Data === undefined) {
                res.render("selection_error")
                return;
            }

            let headers = Object.keys(brand1Data)

            headers.forEach(header => {
                customTable.push([header, brand1Data[header], brand2Data[header]])
            })

            res.render("compare_table", {
                "data": customTable
            })
        })
    }

})


router.get('/brand_data', (req, res) => {
    const {brand} = req.query

    if (brand === undefined) {
        res.json({"error": "Undefined query parameter for field brand"})
        return;
    }

    getData(data => {
        let matchingBrands = data["total"].filter(e => e['Brand Name'] === brand)

        if (matchingBrands.length === 0) {
            res.json({"error": `No data for brand ${brand} could be found.`})
            return;
        }

        let editedBrandData = JSON.parse(JSON.stringify(matchingBrands[0]));
        delete editedBrandData['Brand Name']

        colorInfuse(editedBrandData)

        res.render("brand_data_popup", {"brand_data": editedBrandData, "brand": brand});
    })
})

function colorInfuse(object) {
    let colors = ["#F6000088", "#FF8C0088", "#d600bd88", "#4DE94C88", "#3783FF88", "#4815AA88", "#03dbfc88"]

    {
        let index = 0
        for (let key in object) {
            object[key] = {
                "value": object[key],
                "color": colors[index++ % colors.length]
            }
        }
    }
}


router.get('/brand_section_info', (req, res) => {
    const {brand, section} = req.query

    if (section === undefined || brand === undefined) {
        res.json({"error": "Missing query parameters"})
        return
    }

    getData(data => {

        let sectionInfo = totalToSection(section, data);

        if (sectionInfo === undefined) {
            res.json({"error": "Unknown section for identifier " + section})
            return
        }

        let tableNames = []

        { //example tableNames value: [ '1.1', '1.4', '1.3', '1.2', '1.5' ]
            for (let table in data) {
                if (sectionInfo.exact === true) {
                    if (table === sectionInfo.val)
                        tableNames.push(table)
                } else if (table.startsWith(sectionInfo.val))
                    tableNames.push(table)
            }
        }

        let brandData = {}

        //set brand subtotal values
        if (sectionInfo.lastOnly === true) {
            for (let index in tableNames) {
                let tableName = tableNames[index]
                let table = data[tableName];
                let headers = Object.keys(table[0]);
                let subtotalKey = headers[headers.length - 1]
                let brandRow = getRowOfTableAboutBrand(table, brand, res);
                brandData[subtotalKey] = brandRow[subtotalKey]
            }
        } else {
            for (let index in tableNames) {
                let tableName = tableNames[index]
                let table = data[tableName];
                let headers = Object.keys(table[0]).filter(header => header !== "Brand Name");
                for (let headerIndex in headers) {
                    let header = headers[headerIndex];
                    let brandRow = getRowOfTableAboutBrand(table, brand, res);
                    brandData[header] = brandRow[header]
                }
            }
        }

        colorInfuse(brandData)
        res.render("brand_data_popup", {"brand_data": brandData, "brand": brand});

    })
})

function getRowOfTableAboutBrand(table, brand, res) {
    let brandRows = table.filter(element => element['Brand Name'] === brand)
    if (brandRows.length === 0) {
        res.json({"error": "Invalid Brand " + brand})
        return;
    }
    return brandRows[0]
}

function totalToSection(section, data) {
    switch (section) {
        case "Total Score Section 1":
            return {val: "1", lastOnly: true, exact: false}
        case "Total Score Section 2":
            return {val: "2", lastOnly: true, exact: false}
        case "Total Score Section 3":
            return {val: "3", lastOnly: true, exact: false}
        case "Total Score Section 4":
            return {val: "4", lastOnly: true, exact: false}
        case "Total Score Section 5":
            return {val: "5", lastOnly: true, exact: false}
    }

    for (let key in data) {
        let table = data[key];
        let headers = Object.keys(table[0]);
        let lastHeader = headers[headers.length - 1]
        if (lastHeader === section) {
            return {val: key, lastOnly: false, exact: true}
        }
    }


    return undefined
}

const punctuation = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

function removePunctuation(string) {
    return string
        .split('')
        .filter(function (letter) {
            return punctuation.indexOf(letter) === -1;
        })
        .join('');
}

module.exports = router;