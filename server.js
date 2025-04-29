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

app.post("/print", express.urlencoded({'extended':true}), function(req,res){
    var html = `<!DOCTYPE html><html><body><div style="width:80%; margin-left:10%; margin-right:10%; position:absolute;">`
    for (item of Object.keys(req.body)){
        console.log(req.body[item])
        if (req.body[item]){
            if (item == "name") html += `<h2 style = 'text-align: center; margin: 0px; font-size: 19px;''>${req.body[item]}</h2>`
            if (item == "address" || item == "email" || item == "phone") html += `<p style = 'text-align: center; margin: 0px; font-size: 14px;'>${req.body[item]}</p>`
            if (item.includes("section-title"))  html += `<h3 style = 'margin-bottom: 0px; font-size: 17px;'>${req.body[item]}</h3>
            <hr style = 'margin: 0px; border:black 1px solid;'></hr>`
            if (item.includes("item-name")) html += `<span style ='font-weight: bold; margin: 0px; font-size: 15px;'>${req.body[item]}</span>`
            if (item.includes("date-start")) html += `<span style ='position: absolute; right: 0px; margin: 0px; font-size: 15px;font-style: italic;'>${req.body[item]}`
            if (item.includes("date-end")) html += `- ${req.body[item]}</span>` 
            if (item.includes("role")) html += `<p style ='margin: 0px; font-size: 15px;font-style: italic;'>${req.body[item]}</p>`        
            if (item.includes("description")){
                html += "<ul style = 'list-style-position: outside; margin: 0px;'>"
                for (var row of req.body[item].split("\n")){
                    html += `<li style ='margin: 0px; font-size: 15px;font-style;'>${row}</li>` 
                }
                html += "</ul>"
            }
        }  
    }
    html += `</div></body></html>`

    res.send(html)
})

app.listen(8080, function(){
    console.log("Server running localhost:8080/")
})