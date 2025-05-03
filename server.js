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

app.get("/resume_form", function(req,res){
    res.sendFile(path.join(rootFolder, "resume-form.html"))
})

app.get("/view-resume/:username", function(req,res){
    client.connect()
    .then(function(){
        var db = client.db(dbName)
        var resumes = db.collection("resumes")
        return resumes.findOne({username: req.params.username})
    })
    .then(function(found){
        var html = utils.getResumeHtml(found)
        res.send(html)
    })
    .catch(function(err){
        console.log(err)
    })
    .finally(function(){
        client.close()
    })
    
})

app.post("/resume_action", express.urlencoded({ extended: true }), function(req,res){
    client.connect()
    .then(async function(){
        var db = client.db(dbName)
        var resumesCollection = db.collection("resumes")
        var likesCollection = db.collection("likes")
        var resume = await resumesCollection.findOne({username: req.body.username})
        if (resume){
            await resumesCollection.remove({username: req.body.username})
            return resumesCollection.insertOne({username: req.body.username}, req.body)
        }
        else{
            await likesCollection.insertOne({username: req.body.username, likedBy:[]})
            return resumesCollection.insertOne(req.body)
        }
    })
    .then(function(){
        var html = utils.getResumeHtml(req.body)
        res.send(html)
    })
    .catch(function(err){
        console.log(err)
    })
    .finally(function(){
        client.close()
    })
    
})

app.get("/thumbsUP", function(req, res){
    res.sendFile(path.join(rootFolder, "thumbsUP.png"))
})

app.get("/increaseLike/:username/:user", function(req, res){
    client.connect()
    .then(async function(){
        var db = client.db(dbName)
        var resumesCollection = db.collection("resumes")
        var likesCollection = db.collection("likes")
        var likesObject = await likesCollection.findOne({username: req.params.username})
        var resumeObject = await resumesCollection.findOne({username: req.params.username})
        var newLikedBy = likesObject.likedBy
        
        var likeCount = parseInt(resumeObject.like)
        if (!likesObject.likedBy.includes(""+req.params.user)){
            resumeObject.like = parseInt(resumeObject.like + 1)
            var html = utils.getResumeHtml(resumeObject)
            res.send(html)
            await resumesCollection.updateOne({username: req.params.username}, {$set:{like:likeCount +=1}})

            newLikedBy.push(req.params.user)
            await likesCollection.updateOne({username: req.params.username}, {$set:{likedBy:newLikedBy}})
            await client.close()
        }
        else {
            var html = utils.getResumeHtml(resumeObject)
            res.send(html)
        }
    })
    .catch(function(err){
        console.log(err)
    })
})

app.listen(8080, function(){
    console.log("Server running localhost:8080/")
})