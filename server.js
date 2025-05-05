//EXPRESS IMPORTS
var express = require("express")
var app = express()
var path = require("path")
var crypto = require("crypto")

//MONGO SETUP
const { MongoClient, ObjectId} = require('mongodb');
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

const dbName = "cs337JobsProject"

//UTILS
const utils = require("./utils");
const e = require("express");

//GLOBALS
var rootFolder = path.join(__dirname, 'public/')

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

app.get('/myjobs', function (req, res){
    res.sendFile(path.join(rootFolder, 'mypostings.html'))
})

app.get('/viewjob/:jobid', function (req, res){
    res.send(utils.getJobHtml(req.params.jobid))
})

//FORM SUBMISSION
app.post('/sendjob', express.urlencoded({'extended':true}), function (req, res) {
    var q = req.body
    if(!q.username)
    {
        res.sendFile(path.join(rootFolder, 'please-login.html'))
    }
    else{
        var toSer = {
            'poster': q.username,
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
        } ).catch(err => res.sendFile(path.join(rootFolder, 'submissionfailure.html')))
    }
})

app.post('/apply', function (req, res){
    if(req.body.username == null || req.body.viewJobId == null)
    {
        res.sendFile(path.join(rootFolder, 'please-login.html'))
    }
    var toSer = {
        'username':req.body.username,
        'jid':req.body.viewJobId
    }
    utils.searchByObj(client, "application", dbName, toSer).then(function (arr)
    {
        if(!arr || arr.length === 0)
        {
            return utils.fullInsert(client, "application", dbName, toSer)
        }
        else
        {
            return false
        }
    }).then(function(success){
        if(success)
        {
            res.sendFile(path.join(rootFolder, 'submissionsuccess.html'))
        }
        else
        {
            res.sendFile(path.join(rootFolder, 'submissionfailure.html'))
        }
    } ).catch(err => res.sendFile(path.join(rootFolder, 'submissionfailure.html')))
})

app.get("/resume_form", function(req,res){
    res.sendFile(path.join(rootFolder, "resume-form.html"))
})

//DATA REQUESTS
app.get('/header', function (req, res){
    res.sendFile(path.join(rootFolder, 'headerContent.html'))
})

app.get('/src.js', function (req, res){
    res.sendFile(path.join(rootFolder, 'src.js'))
})

app.get("/view-resume/:username", async function(req,res){
    if (req.params.username == "null"){
        res.sendFile(path.join(rootFolder, 'please-login.html'))
    }
    try{
        var db = client.db(dbName)
        var resumes = db.collection("resume")
        var resumeFound = await resumes.findOne({username: req.params.username})
        if (resumeFound){
            var html = utils.getResumeHtml(resumeFound)
            res.send(html)
        }
        else{
            res.sendFile(path.join(rootFolder, "resumenotfound.html"))
        }  
    }
    catch(err){
        console.log(err)
    }
})

app.post("/resume_action", express.urlencoded({ extended: true }), async function(req,res){
    try{
        if (req.body.username != ""){
            var db = client.db(dbName)
            var resumesCollection = db.collection("resume")
            var likesCollection = db.collection("likes")
            var resume = await resumesCollection.findOne({username: req.body.username})
            if (resume)
                await resumesCollection.deleteOne({username: req.body.username})
            else
                await likesCollection.insertOne({username: req.body.username, likedBy:[]})
            await resumesCollection.insertOne(req.body)
            var html = utils.getResumeHtml(req.body)
            res.send(html)
        }
        else res.sendFile(path.join(rootFolder, 'please-login.html'))
    }
    catch(err){
        console.log(err)
    }
    
})

app.get("/thumbsUP", function(req, res){
    res.sendFile(path.join(rootFolder, "thumbsUP.png"))
})

app.post("/increaseLike", async function(req, res){
    try{
        var db = client.db(dbName)
        var resumesCollection = db.collection("resume")
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
        }
        else {
            var html = utils.getResumeHtml(resumeObject)
            res.send(html)
        }
    }
    catch(err){
        console.log(err)
    }
})

app.get('/getcurjob/:viewJobId', async function (req, res){
    utils.searchByString(client, "job", dbName, "_id", new ObjectId(req.params.viewJobId)).then(arr => res.json(arr))

})

app.get('/getjobs', async function (req, res){
    utils.searchByString(client, "job", dbName, "title", req.query.search).then(arr => res.json(arr))
})

app.get('/getjobsbyposter/:username', async function (req, res){
    utils.searchByString(client, "job", dbName, "poster", req.params.username).then(arr => res.json(arr))
})

app.get('/applicants/:viewJobId', async function (req, res){
    utils.getColl(client, "application", dbName).then(coll => coll.aggregate([
        {
            $match: { jid: req.params.viewJobId }
        },
        {
            $lookup: {
                from: "user",
                localField: "username",
                foreignField: "username",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },
        {
            $replaceWith: "$user"
        }
    ]).toArray()).then( function(arr){
        res.json(arr)
    })

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
    const { username, password, email } = req.body
    if (!username || !password || !email) {
        return res.send("Missing username or password.")
    }
    var passwordHashed = crypto.createHash("sha256").update(password).digest("hex")
    try {
        const usersCol = await utils.getColl(client, "user", dbName)
        const existingUser = await usersCol.findOne({ username: username })

        if (existingUser) {
            return res.sendFile(path.join(rootFolder, 'exsistingusererror.html'))
        }

        await usersCol.insertOne({ username: username, password: passwordHashed, email:email })
        res.sendFile(path.join(rootFolder, 'registersuccess.html'))
    } catch (err) {
        console.error("Error during registration:", err)
        res.status(500).send("Internal Server Error.")
    }
})


// Handle login
app.post('/login', async function(req, res) {
    const { username, password } = req.body;
    var passwordHashed = crypto.createHash("sha256").update(password).digest("hex")
    try {
        const users = await utils.getColl(client, "user", dbName);
        const user = await users.findOne({ username: username, password: passwordHashed });
        if (user) {
            res.send(`
                <script>
                    localStorage.setItem("username", ${JSON.stringify(username)});
                    window.location.href = "/";
                </script>
            `);
        } else {
            res.sendFile(path.join(rootFolder, 'wronglogin.html'));
        }
    } catch (err) {
        console.error(err);
        res.send("Error logging in.");
    }
});
//Logout
app.get('/logout', function(req, res) {
    res.send(`
        <script>
            localStorage.removeItem("username");
            window.location.href = "/";
        </script>
    `);
});

//LISTEN
app.listen(8080, async function(){
    await client.connect()
    console.log("Server running localhost:8080/")
})

process.on("SIGINT", async () => {
    await client.close()
    process.exit()
})