const express = require('express');
const https = require("https");
const router = express.Router({strict: true})


const {getData} = require('./load_data.js')

router.get('/transparency_index', (req, res) => {
    getData(data => {
        res.render("transparency_index", {
        "data" : data["total"]
        })
    })
})

module.exports = router;