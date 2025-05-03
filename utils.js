async function getDB(client, collectionName, dbName)
{
    try {
        await client.connect();
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
        const coll = await getDB(client, collectionName, dbName);
        await insertRecord(coll, obj)
        return true;
    }catch (err)
    {
        return false
    }finally {
        client.close()
    }
}

async function searchByString(client, collectionName, dbName, fieldName, searchStr)
{
    try{
        const coll = await getDB(client, collectionName, dbName);
        if(searchStr === "")
        {
            return await coll.find().toArray()
        }
        const query = {
            [fieldName]: { $regex: searchStr, $options: 'i' }
        }
        return await coll.find(query).toArray()
    }catch (err)
    {
        return null
    }finally {
        client.close()
    }
}

function getResumeHtml(object){
    var html = `<!DOCTYPE html><html><body style ="background-color: dimgray;">`
    var username = ""
    for (item of Object.keys(object)){
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

module.exports = { getDB, insertRecord, getResumeHtml, fullInsert, searchByString}