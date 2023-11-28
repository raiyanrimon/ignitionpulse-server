const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hif0lwq.mongodb.net/?retryWrites=true&w=majority`;

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

    const productCollection = client.db('ignitionpulse').collection('products')
    const userCollection = client.db('ignitionpulse').collection('users')

    app.post('/jwt',async (req, res)=>{
        const user = req.body
        const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
          expiresIn: '1h'
        })
        res.send({token})
      })

      app.get('/products', async(req, res)=>{
        const result = await productCollection.find().toArray()
        res.send(result)
      })

      app.post('/products', async(req, res)=>{
        const item = req.body
        const result = await productCollection.insertOne(item)
        res.send(result)
      })

      app.delete('/products/:id', async (req, res)=>{
        const id = req.params.id
        const query = {_id : new ObjectId(id)}
        const result = await productCollection.deleteOne(query)
        res.send(result)
      })

      app.post('/users' , async (req, res)=>{
        const user = req.body
        const query = {email: user.email}
        const existingUser = await userCollection.findOne(query)
        if(existingUser){
          return res.send({message: 'user already exists', insertedId: null})
        }
        const result = await userCollection.insertOne(user)
        res.send(result)
  
      })
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('Ignition Pulse is Running')
})

app.listen(port, ()=>{
    console.log(`Ignition Pulse Server Running on port ${port}`);
})