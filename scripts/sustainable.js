const express = require('express');
const https = require("https");
const router = express.Router({strict: true})

router.get('/sustainable', (req, res) => {
    res.render("sustainable")
})

module.exports = router;