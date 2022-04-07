const createUrl = async function (req, res) {
    try {

        const longUrl = req.body.longUrl

        if (!longUrl) {
            
            return res.status(400).send({ status: false, message: "please provide required input field" })
        
        }

        if(!isValid(longUrl)){ return res.status(400).send({status:false, message: "url required"})}

        // if(!(/(:?^((https|http|HTTP|HTTPS){1}:\/\/)(([w]{3})[\.]{1})?([a-zA-Z0-9]{1,}[\.])[\w]((\/){1}([\w@?^=%&amp;~+#-_.]+)))$/.test(longUrl))){

        //     return res.status(400).send({status:false, message: "url not valid"})
        // }
       

        const baseUrl = "http://localhost:3000"

        if (!validUrl.isUri(baseUrl)) {

            return res.status(400).send({ status: false, message: "invalid base URL" })

        }

        const cahcedUrlData = await GET_ASYNC(`${longUrl}`)

        if (cahcedUrlData) {

            return res.status(200).send({ status: "true", data: cahcedUrlData })

        }

        let urlPresent = await urlModel.findOne({ longUrl: longUrl }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })

        if (urlPresent) {

            await SET_ASYNC(`${longUrl}`, JSON.stringify(urlPresent))

            return res.status(200).send({ status: true, data: urlPresent })

        }

        const urlCode = shortId.generate()

        const url = await urlModel.findOne({ urlCode: urlCode })

        if (url) {

            return res.status(400).send({ status: false, message: "urlCode already exist in tha db" })

        }

        const shortUrl = baseUrl + '/' + urlCode

        const dupshortUrl = await urlModel.findOne({ shortUrl: shortUrl })

        if (dupshortUrl) {

            return res.status(400).send({ status: false, message: "shortUrl already exist in tha db" })

        }

        const newUrl = {
            longUrl: longUrl,
            shortUrl: shortUrl,
            urlCode: urlCode
        }

        // console.log(newUrl)

        const createUrl = await urlModel.create(newUrl)

        return res.status(201).send({ status: true, data: createUrl })

    }

    catch (err) {

        return res.status(500).send({ status: false, message: err.message })

    }

}