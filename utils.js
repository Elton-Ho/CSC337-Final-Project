async function getColl(client, collectionName, dbName)
{
    try {
        const db = await client.db(dbName);
        return await db.collection(collectionName)
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
        throw error
    }
}

async function insertRecord(collection, obj)
{
    try {
        await collection.insertOne(obj)
    } catch (error) {
        console.error('Error inserting into DB', error);
        throw error
    }
}

async function fullInsert(client, collectionName, dbName, obj)
{
    try{
        const coll = await getColl(client, collectionName, dbName);
        await insertRecord(coll, obj)
        return true;
    }catch (err)
    {
        return false
    }
}

async function searchByString(client, collectionName, dbName, fieldName, searchStr)
{
    try{
        const coll = await getColl(client, collectionName, dbName);
        if(searchStr === "")
        {
            return await coll.find().toArray()
        }
        var query;
        if(fieldName !== "_id")
        {
            query = {
                [fieldName]: { $regex: searchStr, $options: 'i' }
            }
        }
        else
        {
            query = {[fieldName]: searchStr}
        }
        return await coll.find(query).toArray()
    }catch (err)
    {
        return null
    }
}

async function searchByObj(client, collectionName, dbName, fieldValues)
{
    try{
        const coll = await getColl(client, collectionName, dbName);

        if (!fieldValues || Object.keys(fieldValues).length === 0) {
            return await coll.find().toArray()
        }
        const query = {}
        for (const [key, value] of Object.entries(fieldValues)) {
            query[key] = value
        }
        return await coll.find(query).toArray()
    }catch (err)
    {
        return null
    }
}

function getResumeHtml(object){
    var html = `<!DOCTYPE html><html><head><style>
        #like-button:hover {
            cursor: pointer;
        }
        </style><script src="/src.js"></script></head>
        <body style ="background-color: dimgray;" onload = "addHeader()">`
    var username = ""
    for (let item of Object.keys(object)){
        if (object[item]){
            if (item == "username") {
                username = object[item]
                html += `<h1>${object[item]} 's Resume: </h1><div style="width:80%; margin-left:10%; position:absolute;background-color: white;">`
            }
            if (item == "like") {
                html += `<div style = "position:fixed; left:2%">
                        <script>
                                function increaseLike(){
                                    var user = window.localStorage.getItem('username')
                                    body = {'username':'${username}', 'user':user}
                                    fetch("/increaseLike", {
                                            'headers': {'Content-Type': 'application/json'},
                                            'method': 'POST',
                                            'body': JSON.stringify(body)
                                        })
                                        .then(function(res){
                                            return res.text()
                                        })
                                        .then(function(text){
                                            document.open()
                                            document.write(text)
                                            document.close()
                                        })
                                        .catch(function(err){
                                            console.log(err)
                                        })
                                }
                        </script>
                        <img src ='/thumbsUP' id = "like-button" style="width:50px;height:60px;" alt = "black thumbs up button" onclick = "increaseLike()">`
                html += `<h3 style = 'font-size: 17px;'>Likes: ${object[item]}</h3></div>`
            }
            if (item == "name") html += `<h2 style = 'text-align: center; margin: 0px; font-size: 19px;'>${object[item]}</h2>`
            if (item == "address" || item == "email" || item == "phone") html += `<p style = 'text-align: center; margin: 0px; font-size: 14px;'>${object[item]}</p>`
            if (item.includes("section-title"))  html += `<h3 style = 'margin-bottom: 0px; font-size: 17px;'>${object[item]}</h3>
            <hr style = 'margin: 0px; border:black 1px solid;'></hr>`
            if (item.includes("item-name")) html += `<span style ='font-weight: bold; margin: 0px; font-size: 15px;'>${object[item]}</span>`
            if (item.includes("date-start")) html += `<span style ='position: absolute; right: 0px; margin: 0px; font-size: 15px;font-style: italic;'>${object[item]}`
            if (item.includes("date-end")) html += `- ${object[item]}</span>` 
            if (item.includes("role")) html += `<p style ='margin: 0px; font-size: 15px;font-style: italic;'>${object[item]}</p>`        
            if (item.includes("description")){
                html += "<ul style = 'list-style-position: outside; margin: 0px;'>"
                for (var row of object[item].split("\n")){
                    html += `<li style ='margin: 0px; font-size: 15px;font-style;'>${row}</li>` 
                }
                html += "</ul>"
            }
        }  
    }
    html += `</div></body></html>`

    return html
}


function getJobHtml(jobid){
    html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>View Job</title>
    <style>
        body{
            background-color: dimgray;
        }
      </style>
</head>
<script>
    function apply(){
        var user = window.localStorage.getItem('username')
        var jobid = "${jobid}"
        body = {'viewJobId':jobid, 'username':user}
        fetch("/apply", {
                'headers': {'Content-Type': 'application/json'},
                'method': 'POST',
                'body': JSON.stringify(body)
            })
            .then(function(res){
                return res.text()
            })
            .then(function(text){
                document.open()
                document.write(text)
                document.close()
            })
            .catch(function(err){
                console.log(err)
            })
    }
    function loadJob()
    {
        var myPoster = ""
        fetch("/getcurjob/${jobid}").then(res => res.json()).then(function(arr)
        {
            console.log(arr)
            const job = arr[0]
            const title = document.getElementById("title")
            const salRange = document.getElementById("salary")
            const poster = document.getElementById("poster")
            const reqs = document.getElementById("reqs")
            const desc = document.getElementById("desc")
            title.innerText += " " +job["title"]
            poster.innerText += " " +job["poster"]
            salRange.innerText += " " +job["salaryMin"]+"-"+job["salaryMax"]
            reqs.innerText += " " +job["reqs"]
            desc.innerText += " " +job["desc"]
            myPoster = job["poster"]

            return window.localStorage.getItem("username");
        }).then(function (user)
        {
            const main = document.getElementById("main")
            if(user == myPoster)
            {
                return fetch("/applicants/${jobid}")
            }
            else
            {
                const newNode = document.getElementById("apply").content.cloneNode(true);
                main.appendChild(newNode)
                document.getElementById("apps").style.display = "none"
                return Promise.resolve()
            }
        }).then(function (applicants) {
            if (!applicants) {
                return
            }
            return applicants.json()
        }).then(function(applicants){
            const main = document.getElementById("main")
            for(const ind in applicants)
            {
                var app = applicants[ind]
                const newNode = document.getElementById("applicant").content.cloneNode(true);
                const username = newNode.querySelector(".username")
                const email = newNode.querySelector(".email")
                const link = newNode.querySelector(".link")
                username.innerText += app["username"]
                email.innerText += app["email"]
                link.href = "/view-resume/"+app["username"]
                main.appendChild(newNode)
            }
        }).catch(function (err){console.log(err)})
    }
    window.addEventListener("DOMContentLoaded", () => {
        addHeader()
    })
</script>
<script src="/src.js"></script>
<template id="apply">
    <a onclick="apply()" style="color: white; background-color: black;text-decoration: underline;">Apply</a>
</template>
<template id="applicant">
    <p class="username">Username: </p>
    <p class="email">Email: </p>
    <a class="link">View Resume</a>
</template>
<body id="main" onload="loadJob()">
  <h1 id="title"></h1>
  <p id="poster">Poster:  </p>
  <p id="salary">Salary:  </p>
  <p id="reqs">Requirements:  </p>
  <p id="desc">Description:  </p>
  <h1 id="apps">Applicants:  </h1>
</body>
</html>`
    return html
}
module.exports = { getColl, insertRecord, getResumeHtml, fullInsert, searchByString, searchByObj, getJobHtml}