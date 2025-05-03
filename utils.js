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

module.exports = { getDB, insertRecord, fullInsert, searchByString }