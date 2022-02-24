const express = require('express');
const https = require("https");
const router = express.Router({strict: true})

router.get('/shop', (req, res) => {
    res.render("shop")
})

module.exports = router;