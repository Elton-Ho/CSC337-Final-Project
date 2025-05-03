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

function getResumeHtml(object){
    var html = `<!DOCTYPE html><html><body><div style="width:80%; margin-left:10%; margin-right:10%; position:absolute;">`
    for (item of Object.keys(object)){
        console.log(object[item])
        if (object[item]){
            if (item == "name") html += `<h2 style = 'text-align: center; margin: 0px; font-size: 19px;''>${object[item]}</h2>`
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

module.exports = { getDB, insertRecord, getResumeHtml}