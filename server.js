//EXPRESS IMPORTS
var express = require("express")
var app = express()
var path = require("path")

//MONGO SETUP
const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
const dbName = "cs337JobsProject"

//UTILS
const utils = require("./utils")

//GLOBALS
var rootFolder = path.join(__dirname, 'public/')
var curUserName = null;

//PAGE REQUESTS
app.get("/", function(req,res){ // homepage
    res.sendFile(path.join(rootFolder, 'index.html'))
})

app.get('/postjob', function (req, res){
    res.sendFile(path.join(rootFolder, 'postjob.html'))
})

//FORM SUBMISSION
app.post('/sendjob', express.urlencoded({'extended':true}), function(req, res){
    res.sendFile(path.join(rootFolder, 'processing.html'))
    var q = req.body
    var toSer = {'poster':curUserName,'title':q.title,'salaryMin':q.salaryMin,'salaryMax':q.salaryMax,'reqs':q.reqs, 'desc':q.desc}
    utils.getDB(client, "job", dbName).then(
        function(collection){
            return utils.insertRecord(collection, toSer)
        }
    ).then(
        function(ret){
            res.sendFile(path.join(rootFolder, 'submissionsuccess.html'))
        }
        ).catch(
            function (err) {
                res.sendFile(path.join(rootFolder, 'submissionfailure.html'))
            })
})


//DATA REQUESTS
app.get('/header', function (req, res){
    res.sendFile(path.join(rootFolder, 'headerContent.html'))
})

app.get('/src.js', function (req, res){
    res.sendFile(path.join(rootFolder, 'src.js'))
})

app.listen(8080, function(){
    console.log("Server running localhost:8080/")
})