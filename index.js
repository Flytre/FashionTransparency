const express = require('express');
const app = express();

const https = require("https");
const router = express.Router({strict: true})

let hbs = require('hbs')
app.set('view engine', 'hbs')

let path = require('path')
app.use(express.static(path.join(__dirname,'static')))

app.get('/', (req, res) => {
    res.render("home_page")
})

const load_data = require('./scripts/load_data.js')
app.use(load_data.router)

const map = require('./scripts/map.js')
app.use(map)

const shop = require('./scripts/shop.js')
app.use(shop)

const transparency_index = require('./scripts/transparency_index.js')
app.use(transparency_index)

const sustainable = require('./scripts/sustainable.js')
app.use(sustainable)


let listener = app.listen(process.env.PORT || 8080, process.env.HOST || "0.0.0.0", function() {
    console.log("Express server started");
});