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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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


app.listen(8080, function(){
    console.log("Server running localhost:8080/")
})