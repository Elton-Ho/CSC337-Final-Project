var express = require("express")
var app = express()
var path = require("path")

app.get("/", function(req,res){ // homepage

})

app.get("/resume_form", function(req,res){
    res.sendFile(path.join(__dirname, "resume-form.html"))
})

app.get("/print", function(req,res){
    res.send(req.query)
})

app.listen(8080, function(){
    console.log("Server running localhost:8080/")
})