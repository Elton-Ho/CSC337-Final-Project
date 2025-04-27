var express = require("express")
var app = express()
var path = require("path")
const fs = require("fs");

var rootFolder = path.join(__dirname, 'public/')

//PAGE REQUESTS
app.get("/", function(req,res){ // homepage
    res.sendFile(path.join(rootFolder, 'index.html'))
})

app.get('/postjob', function (req, res){
    res.sendFile(path.join(rootFolder, 'postjob.html'))
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