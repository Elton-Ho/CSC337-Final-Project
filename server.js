var express = require("express")
var app = express()
var path = require("path")

app.get("/", function(req,res){ // homepage

})

app.get("resume_form", function(req,res){ // homepage
    
})


app.listen(8080, function(){
    console.log("Server running localhost:8080/")
})