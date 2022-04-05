const mongoose = require('mongoose')
const urlModel = require('../model/urlModel')
const validUrl = require('valid-url')  //npm install express mongoose shortid valid-url
const shortid = require('shortid')

const isValidBody = function (body) {
    return Object.keys(body).length > 0;
}




const createUrl = async function (req, res) {
    try {
        // Validate body
        if (!isValidBody(req.body)) {
            return res.status(400).send({ status: false, message: "please provide some data" })
        }
        //Validate query(it must not be present)
        const query = req.query;
        if (isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters.This is not allow " });
        }

        const params = req.params;
        if (isValidBody(params)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters.Invalid request this is not allow" })
        }
        const longUrl = req.body.longUrl
        if (!isValid(longUrl)) {
            return res.status(400).send({ status: false, message: "Please provide longUrl" })
        }
        if (validUrl.isUri(longUrl.trim())) {
            let url = await urlModel.findOne({ longUrl: longUrl })
            // if(url) {
            //     return res.status(400).send({status: false,message: "The URL is already shortened", data: url.shortUrl})
            // } 
        } else {
            return res.status(400).send({ status: false, message: "this URL is Invalid longUrl" })
        }


        const baseUrl = 'http://localhost:3000'

        if (!validUrl.isUri(baseUrl)) {   ///checking if the provided input is a valid UR
            return res.status(400).send({ status: false, message: "this URL is Invalid baseUrl" })
        }

        //The urlCode is a string property that will store the unique ID related to each URL
        const urlCode = shortid.generate() //The short-id module creates user-friendly and unique ids for our URLs.
        const shortUrl = baseUrl + '/' + urlCode.toLowerCase()


        finalurl = await urlModel.create({ longUrl, shortUrl, urlCode })
        return res.status(201).send({ status: true, message: "success", data: finalurl })

    }
    catch (err) {
        //console.log("This is the error :", err.message)
        return res.status(500).send({ status: false, message: "Error" })
    }
}



const getUrl = async function (req, res) {
    try {
        const body = req.body;
        if (isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters. Body should not be present" })
        }

        const query = req.query;
        if (isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters. Query must not be present" });
        }

        let urlcode = req.params.urlCode.trim()
        if (!isValid(urlcode)) {
            return res.status(400).send({ status: false, message: "This is invalid request" })
        }
        const code = await urlModel.findOne({ urlCode: urlcode })
        if (!code) {
            return res.status(404).send({ status: false, message: "Sorry, URL not found" })
        }
        return res.status(302).redirect(code.longUrl)

    }

    catch (err) {
        return res.status(500).send({ status: false, message: "error" })
    }
}

module.exports.createUrl = createUrl
module.exports.getUrl = getUrl