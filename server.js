//EXPRESS IMPORTS
var express = require("express")
var app = express()
var path = require("path")

//MONGO SETUP
const { MongoClient, ObjectId} = require('mongodb');
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

const dbName = "cs337JobsProject"

//UTILS
const utils = require("./utils")

//GLOBALS
var rootFolder = path.join(__dirname, 'public/')
var curUserName = null;
var jobToView = null;
var viewJobId = null;

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

app.get('/viewjob', function (req, res){
    jobToView = req.query.job
    viewJobId = req.query.jid
    res.sendFile(path.join(rootFolder, 'viewjob.html'))
})

//FORM SUBMISSION
app.post('/sendjob', express.urlencoded({'extended':true}), function (req, res) {
    var q = req.body
    if(!curUserName)
    {
        res.sendFile(path.join(rootFolder, 'please-login.html'))
    }
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
    } ).catch(err => res.sendFile(path.join(rootFolder, 'submissionfailure.html')))
})

app.get('/apply', function (req, res){
    if(!curUserName || !viewJobId)
    {
        res.sendFile(path.join(rootFolder, 'please-login.html'))
    }
    var toSer = {
        'user':curUserName,
        'jid':viewJobId
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

app.get('/myresume', (req, res, next) => {
    if(!curUserName)
    {
        res.sendFile(path.join(rootFolder, 'please-login.html'))
    }
    req.url = `/view-resume/${curUserName}`
    app.handle(req, res, next) // Forwards the request internally
})



//DATA REQUESTS
app.get('/header', function (req, res){
    res.sendFile(path.join(rootFolder, 'headerContent.html'))
})

app.get('/src.js', function (req, res){
    res.sendFile(path.join(rootFolder, 'src.js'))
})

app.get("/view-resume/:username", function(req,res){
    client.connect()
    .then(function(){
        var db = client.db(dbName)
        var resumes = db.collection("resume")
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
            var resumesCollection = db.collection("resume")
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

app.get("/increaseLike/:username/:user", function(req, res){
    client.connect()
    .then(async function(){
        var db = client.db(dbName)
        var resumesCollection = db.collection("resume")
        var likesCollection = db.collection("likes")
        var likesObject = await likesCollection.findOne({username: req.params.username})
        var resumeObject = await resumesCollection.findOne({username: req.params.username})
        var newLikedBy = likesObject.likedBy
        
        var likeCount = parseInt(resumeObject.like)
        if (req.params.user != "null" && !likesObject.likedBy.includes(""+req.params.user)){
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

app.get('/curuser', function (req, res){
    res.send(curUserName)
})

app.get('/getcurjob', async function (req, res){
    utils.searchByString(client, "job", dbName, "_id", new ObjectId(viewJobId)).then(arr => res.json(arr))

})

app.get('/getjobs', async function (req, res){
    utils.searchByString(client, "job", dbName, "title", req.query.search).then(arr => res.json(arr))
})

app.get('/getjobsbyposter', async function (req, res){
    utils.searchByString(client, "job", dbName, "poster", curUserName).then(arr => res.json(arr))
})

app.get('/applicants', async function (req, res){
    utils.getColl(client, "application", dbName).then(coll => coll.aggregate([
        {
            $match: { jobId: viewJobId }
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
    ]).toArray()).then( arr => res.json(arr))

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

    try {
        const usersCol = await utils.getColl(client, "user", dbName)
        const existingUser = await usersCol.findOne({ username: username })

        if (existingUser) {
            return res.send("Username already exists. <a href='/register'>Try again</a>")
        }

        await usersCol.insertOne({ username: username, password: password, email: email })
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
        const users = await utils.getColl(client, "user", dbName);
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
        const usersCol = await utils.getColl(client, "user", dbName)
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
        const users = await utils.getColl(client, "user", dbName);
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
app.listen(8080, async function(){
    await client.connect()
    console.log("Server running localhost:8080/")
})

process.on("SIGINT", async () => {
    await client.close()
    process.exit()
})