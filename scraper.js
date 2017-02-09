'use strict';

const fs = require('fs');
const cheerio = require('cheerio');
const json2csv = require('json2csv');
const moment = require('moment');
const request = require('request');

// urls
const baseUrl = 'http://shirts4mike.com/';
const mainUrl = 'http://shirts4mike.com/shirts.php';
// csv
const shirts = [];
const dataFields = ['title', 'price', 'imageURL', 'url', 'time'];
const dataFieldNames = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];

// Check if data directory exists
fs.stat('./data/', function (error) {
    if (error) {
        fs.mkdir('./data');
    }
});

request(mainUrl, (error, response, body) => {
    if (error || response.statusCode !== 200) {
        // TODO: Log error
        return;
    }

    const $mainHtml = cheerio.load(body);
    const products = $mainHtml('.products li a');

    for (var i = 0; i < products.length; i++) {
        //get the full link
        const href = cheerio(products[i]).attr('href');
        const productLink = baseUrl + href;
        // visit link
        request(productLink, (error, response, productBody) => {
            if (error || response.statusCode !== 200) {
                // TODO: Log error
                return;
            }

            const $productHtml = cheerio.load(productBody);
            const title = $productHtml('title').text();
            const price = $productHtml('.price').text();
            const image = $productHtml('.shirt-picture img').attr('src');
            const url = response.request.uri.href;
            const timestamp = moment().format("MMMM Do YYYY, h:mm:ss a");

            shirts.push({
                title,
                price,
                imageURL: baseUrl + image,
                url,
                time: timestamp
            });

            // If array has all shirts write to csv
            if (shirts.length === 8) {
                writeToCSV();
            }
        })
    }
});

function writeToCSV () {
    const csv = json2csv({
        data: shirts,
        fields: dataFields,
        fieldNames: dataFieldNames
    });

    fs.writeFile(`./data/${moment().format("YYYY-MM-DD")}.csv`, csv, (error) => {
        if (error) {
            // TODO: Handle error
            return;
        }

        console.log('File saved');
    });
}
