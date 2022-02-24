const express = require('express');
const https = require("https");
const router = express.Router({strict: true})

router.get('/map', (req, res) => {
    res.render("map")
})

module.exports = router;