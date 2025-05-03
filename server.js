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
var curUserName = "exUser";
var jobToView = "Test1"

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//PAGE REQUESTS
app.get("/", function(req,res){ // homepage
    res.sendFile(path.join(rootFolder, 'index.html'))
})

app.get('/postjob', function (req, res){
    res.sendFile(path.join(rootFolder, 'postjob.html'))
})

app.get('/displayjobs', function (req, res){
    res.sendFile(path.join(rootFolder, 'displayJobs.html'))
})

app.get('/viewjob', function (req, res){
    res.sendFile(path.join(rootFolder, 'viewjob.html'))
})

//FORM SUBMISSION
app.post('/sendjob', express.urlencoded({'extended':true}), function (req, res) {
    var q = req.body
    var toSer = {
        'poster': curUserName,
        'title': q.title,
        'salaryMin': q.salaryMin,
        'salaryMax': q.salaryMax,
        'reqs': q.reqs,
        'desc': q.desc
    }
    utils.fullInsert(client, "job", dbName, toSer).then(function(success){
        if(success)
        {
            res.sendFile(path.join(rootFolder, 'submissionsuccess.html'))
        }
        else
        {
            res.sendFile(path.join(rootFolder, 'submissionfailure.html'))
        }
    } )
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
    if (req.body.username != ""){
        client.connect()
        .then(async function(){
            var db = client.db(dbName)
            var resumesCollection = db.collection("resumes")
            var likesCollection = db.collection("likes")
            var resume = await resumesCollection.findOne({username: req.body.username})
            if (resume)
                await resumesCollection.deleteOne({username: req.body.username})
            else
                await likesCollection.insertOne({username: req.body.username, likedBy:[]})
            return resumesCollection.insertOne(req.body)
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
    }
    else res.sendFile(path.join(rootFolder, 'please-login.html'))
    
})

app.get("/thumbsUP", function(req, res){
    res.sendFile(path.join(rootFolder, "thumbsUP.png"))
})

app.post("/increaseLike", function(req, res){
    client.connect()
    .then(async function(){
        var db = client.db(dbName)
        var resumesCollection = db.collection("resumes")
        var likesCollection = db.collection("likes")
        var likesObject = await likesCollection.findOne({username: req.body.username})
        var resumeObject = await resumesCollection.findOne({username: req.body.username})
        var newLikedBy = likesObject.likedBy
        
        var likeCount = parseInt(resumeObject.like)
        if (req.body.user != null && !likesObject.likedBy.includes(""+req.body.user)){
            resumeObject.like = parseInt(resumeObject.like + 1)
            var html = utils.getResumeHtml(resumeObject)
            res.send(html)
            await resumesCollection.updateOne({username: req.body.username}, {$set:{like:likeCount +=1}})

            newLikedBy.push(req.body.user)
            await likesCollection.updateOne({username: req.body.username}, {$set:{likedBy:newLikedBy}})
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

app.get('/curuser', function (req, res){
    res.send(curUserName)
})

app.get('/getcurjob', async function (req, res){
    utils.searchByString(client, "job", dbName, "title", jobToView).then(arr => res.json(arr))

})

app.get('/getjobs', async function (req, res){
    utils.searchByString(client, "job", dbName, "title", req.query.search).then(arr => res.json(arr))

})

// User login system

// Page routes
app.get('/login', function(req, res) {
    res.sendFile(path.join(rootFolder, 'login.html'));
});

app.get('/register', function(req, res) {
    res.sendFile(path.join(rootFolder, 'register.html'));
});

// Handle registration
app.post("/register", async (req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
        return res.send("Missing username or password.")
    }

    try {
        const usersCol = await utils.getDB(client, "users", dbName)
        const existingUser = await usersCol.findOne({ username: username })

        if (existingUser) {
            return res.send("Username already exists. <a href='/register'>Try again</a>")
        }

        await usersCol.insertOne({ username: username, password: password })
        res.send("Registration successful. <a href='/login'>Login now</a>")
    } catch (err) {
        console.error("Error during registration:", err)
        res.status(500).send("Internal Server Error.")
    }
})


// Handle login
app.post('/login', async function(req, res) {
    const { username, password } = req.body;
    try {
        const users = await utils.getDB(client, "users", dbName);
        const user = await users.findOne({ username: username, password: password });
        if (user) {
            curUserName = username;
            res.send(`
                <script>
                    localStorage.setItem("username", ${JSON.stringify(username)});
                    window.location.href = "/";
                </script>
            `);
        } else {
            res.send("Invalid username or password.");
        }
    } catch (err) {
        console.error(err);
        res.send("Error logging in.");
    }
});
//Logout
app.get('/logout', function(req, res) {
    curUserName = null;
    res.send(`
        <script>
            localStorage.removeItem("username");
            window.location.href = "/";
        </script>
    `);
});

// User login system

// Page routes
app.get('/login', function(req, res) {
    res.sendFile(path.join(rootFolder, 'login.html'));
});

app.get('/register', function(req, res) {
    res.sendFile(path.join(rootFolder, 'register.html'));
});

// Handle registration
app.post("/register", async (req, res) => {
    const { username, password, email } = req.body
    if (!username || !password || !email) {
        return res.send("Missing username or password.")
    }

    try {
        const usersCol = await utils.getDB(client, "users", dbName)
        const existingUser = await usersCol.findOne({ username: username })

        if (existingUser) {
            return res.send("Username already exists. <a href='/register'>Try again</a>")
        }

        await usersCol.insertOne({ username: username, password: password, email:email })
        res.send("Registration successful. <a href='/login'>Login now</a>")
    } catch (err) {
        console.error("Error during registration:", err)
        res.status(500).send("Internal Server Error.")
    }
})


// Handle login
app.post('/login', async function(req, res) {
    const { username, password } = req.body;
    try {
        const users = await utils.getDB(client, "users", dbName);
        const user = await users.findOne({ username: username, password: password });
        if (user) {
            curUserName = username;
            res.send(`
                <script>
                    localStorage.setItem("username", ${JSON.stringify(username)});
                    window.location.href = "/";
                </script>
            `);
        } else {
            res.send("Invalid username or password.");
        }
    } catch (err) {
        console.error(err);
        res.send("Error logging in.");
    }
});
//Logout
app.get('/logout', function(req, res) {
    curUserName = null;
    res.send(`
        <script>
            localStorage.removeItem("username");
            window.location.href = "/";
        </script>
    `);
});

//LISTEN
app.listen(8080, function(){
    console.log("Server running localhost:8080/")
})