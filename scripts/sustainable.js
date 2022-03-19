const express = require('express');
const https = require("https");
const router = express.Router({strict: true})

const {getData} = require('./load_data.js')

router.get('/sustainable', (req, res) => {
    getData(data => {
        res.render("sustainable", {"data": data['sustainable_brands']})
    })
})

module.exports = router;