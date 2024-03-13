const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port  = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors())
app.use(express.json())

console.log(process.env.DB_USER);

const uri = `mongodb+srv://carUser:QG0PGAB4EGE4MUfu@cluster0.mbzvmhe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db('carDoctor').collection('services')
    const bookingCollection = client.db('carDoctor').collection('bookings')

    app.get('/services', async(req,res)=>{
        const cursor = servicesCollection.find();
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get('/services/:id', async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
       
        const result = await servicesCollection.findOne(query)
        res.send(result)
    })


    // bookings
    app.get('/book', async(req,res) => {
        console.log(req.query);
        let query = {}
        if(req.query?.email){
            query = {email : req.query.email}
        }
        const result = await bookingCollection.find(query).toArray()
        res.send(result)
    })
    app.post('/book', async(req,res)=>{
        const booking = req.body;
        console.log(booking);
        const result = await bookingCollection.insertOne(booking)
        res.send(result)
    })

    app.delete('/book/:id', async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await bookingCollection.deleteOne(query)
        res.send(result)
    })

    app.patch('/book/:id', async(req,res)=>{
        const id = req.params.id;
        const updateBooking = req.body;
        const filter = {_id: new ObjectId(id)}
        const updateDoc = {
            $set: {
                status: updateBooking
            }
        }
        const result = await bookingCollection.updateOne(filter,updateDoc)
        res.send(result)
        console.log(updateBooking);

    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('hio')
})

app.listen(port,()=>{
    console.log(`runnng ${port}`);
})