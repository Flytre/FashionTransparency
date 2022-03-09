const express = require('express');
const https = require("https");
const router = express.Router({strict: true})

//code from https://stackoverflow.com/questions/16801687/javascript-random-ordering-with-seed
//allows us to take seeded randoms (getting the same random output from the same input every time)


function xmur3(str) {
    for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    } return function() {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

function mulberry32(a) {
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

const seededRandom = ({rng = null, seed = "apples"} = {}) => {
    rng = rng || mulberry32(xmur3(seed)());

    const rnd = (lo, hi, defaultHi=1) => {
        if (hi === undefined) {
            hi = lo === undefined ? defaultHi : lo;
            lo = 0;
        }

        return rng() * (hi - lo) + lo;
    };

    const rndInt = (lo, hi) => Math.floor(rnd(lo, hi, 2));

    const shuffle = a => {
        for (let i = a.length - 1; i > 0; i--) {
            const j = rndInt(i + 1);
            const x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
    };

    return {rnd, rndInt, shuffle};
};




module.exports.router = router;
module.exports.seededRandom = seededRandom