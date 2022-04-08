const mongoose= require('mongoose')
const urlModel=require('../model/urlModel')
const validUrl = require('valid-url')  //npm install express mongoose shortid valid-url
const shortid = require('shortid')
const redis = require("redis");
const { promisify } = require("util");

const redisClient = redis.createClient(
    16368,
    "redis-16368.c15.us-east-1-2.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("Y52LH5DG1XbiVCkNC2G65MvOFswvQCRQ", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });
  

const isValid = (value) => {

    if (typeof value === 'undefined' || value === null) return false
  
    if (typeof value === 'string' && value.trim().length === 0) {
  
      return false
    }
    return true
  }


     const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
    const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

  const createUrl = async function(req,res) {
    try {                                      
        

        if(Object.keys(req.body)==0) {
            return res.status(400).send({status: false, message: "please provide some data"})
        }

        const longUrl = req.body.longUrl
        if(!isValid(longUrl)) {
            return res.status(400).send({status: false, message:"Please provide longUrl"})
        }
        if (!(/(:?^((https|http|HTTP|HTTPS){1}:\/\/)(([w]{3})[\.]{1})?([a-zA-Z0-9]{1,}[\.])[\w]*((\/){1}([\w@?^=%&amp;~+#-_.]+))*)$/.test(longUrl.trim()))) {

            return res.status(400).send({ status: false, message: "please provide valid URL" })
        }


         let catchedUrl=await GET_ASYNC(`${longUrl}`)
         if (catchedUrl) {
            return res.status(200).send({ status: true,msg:"recived from Cache",data: JSON.parse(catchedUrl) })//---if already exist
        }
        if(validUrl.isUri(longUrl)) {
            let url = await urlModel.findOne({longUrl: longUrl}).select({_id:0, updatedAt:0, createdAt:0, _v:0})
            if(url) {
                await SET_ASYNC(`${longUrl}`,JSON.stringify(url)) 
                return res.status(200).send({status: true,message: "The URL is already shortened", shorturl: url.shortUrl})
            } 
        } 


        const baseUrl = 'http://localhost:3000'

        if(!validUrl.isUri(baseUrl)) {   ///checking if the provided input is a valid UR
                return res.status(400).send({ status: false, message: "this URL is Invalid baseUrl"})
            }

            //The urlCode is a string property that will store the unique ID related to each URL
        const urlCode = shortid.generate() //The short-id module creates user-friendly and unique ids for our URLs.
        const shortUrl = baseUrl + '/' + urlCode.toLowerCase()
      
        finalurl = await urlModel.create({longUrl,shortUrl,urlCode})
        return res.status(201).send({status: true, message:"success", data: finalurl})
        
    }
    catch (err) {
      
        return res.status(500).send({ status:false,message: "Error" })
    }
}




const getUrl= async function(req,res){
    try{

    let urlcode=await GET_ASYNC(`${ req.params.urlCode.trim()}`)
   if(!isValid(req.params.urlCode.trim())){
       return res.status(400).send({status:false, message:"invalid request"})
   }

    const code= await urlModel.findOne({urlCode:req.params.urlCode})
    if(!code){
    return res.status(404).send({status:false, message:"Sorry, URL not found" })
    }
    await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(code))
    return res.status(302).redirect( code.longUrl)

}

catch(err){
    return res.status(500).send({status:false, message:err.message})
}
}

module.exports.createUrl = createUrl
module.exports.getUrl=getUrl
