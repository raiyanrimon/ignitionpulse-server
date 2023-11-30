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
    const reviewCollection = client.db('ignitionpulse').collection('reviews')

    app.post('/jwt',async (req, res)=>{
        const user = req.body
        const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
          expiresIn: '1h'
        })
        res.send({token})
      })


      // middlewares
    const verifyToken = (req, res, next)=>{
      console.log('inside verify token', req.headers.authorization);
      if(!req.headers.authorization){
        return res.status(401).send({message: 'unauthorized  access'})
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token,process.env.ACCESS_SECRET_TOKEN, (err , decoded)=>{
        if(err){
          return res.status(401).send({message: 'unauthorized  access'})
      }
      req.decoded = decoded
      next()
      } )
      
    }

    const verifyAdmin = async (req, res, next)=>{
      const email = req.decoded.email
      console.log(email);
      const query = {email: email}
      const user = await userCollection.findOne(query)
      const isAdmin = user?.role === 'admin'
      if(!isAdmin){
        return res.status(403).send({message: 'forbidden access'})
      }
      next()

    }

    const verifyMod = async (req, res, next)=>{
      const email = req.decoded.email
      const query = {email: email}
      const user = await userCollection.findOne(query)
      const isMod = user?.role === 'moderator'
      if(!isMod){
        return res.status(403).send({message: 'forbidden access'})
      }
      next()

    }

      app.get('/products', async(req, res)=>{
        const result = await productCollection.find().toArray()
        res.send(result)
      })
      app.get('/products/:id',verifyToken, async(req, res)=>{
        const id = req.params.id
        const query = {_id : new ObjectId(id)}
        const result = await productCollection.findOne(query)
        res.send(result)
      })

      app.patch('/products/:id',verifyToken, async (req, res) => {
        const item = req.body;
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) }
        const updatedDoc = {
          $set: {
            name: item.name,
            description: item.description,
            image: item.image,
            tags: item.tags,
            link: item.link
          }
        }
  
        const result = await menuCollection.updateOne(filter, updatedDoc)
        res.send(result);
      })

      app.post('/reviews',verifyToken, async (req, res)=>{
        const review = req.body
        const result = await reviewCollection.insertOne(review)
        res.send(result)
      })

      app.get('/reviews', async(req, res)=>{
        const result = await reviewCollection.find().toArray()
        res.send(result)
      })

      app.post('/products',verifyToken, async(req, res)=>{
        const item = req.body
        const result = await productCollection.insertOne(item)
        res.send(result)
      })

      app.patch('/products/accept/:id',verifyToken,verifyMod, async (req, res)=>{
        const id = req.params.id
      const filter = {_id : new ObjectId(id)}
      const updatedDoc ={
        $set: {
          status: 'accepted'
        }
      }
      const result = await productCollection.updateOne(filter, updatedDoc)
      res.send(result)
      })

      app.patch('/products/reject/:id',verifyToken,verifyMod, async (req, res)=>{
        const id = req.params.id
      const filter = {_id : new ObjectId(id)}
      const updatedDoc ={
        $set: {
          status: 'rejected'
        }
      }
      const result = await productCollection.updateOne(filter, updatedDoc)
      res.send(result)
      })

      app.patch('/products/feature/:id',verifyToken,verifyMod, async (req, res)=>{
        const id = req.params.id
      const filter = {_id : new ObjectId(id)}
      const updatedDoc ={
        $set: {
          isFeatured: 'featured'
        }
      }
      const result = await productCollection.updateOne(filter, updatedDoc)
      res.send(result)
      })

      // app.get('/products/:id', async (req, res)=>{
      //   const id = req.params.id
      //   const query = {_id: new ObjectId(id)}
      //   const result = await productCollection.findOne(query)
      //   res.send(result)
      // })
      
      app.get('/products/user/:email',verifyToken, async (req, res)=>{
        const email = req.params.email
       const query = {email: email}
       const result = await productCollection.find(query).toArray()
       res.send(result)
      })

      app.delete('/products/:id',verifyToken, async (req, res)=>{
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

      app.get('/users', verifyToken, verifyAdmin, async(req, res)=>{
        const result = await userCollection.find().toArray()
        res.send(result)
      })

      app.get('/users/admin/:email', verifyToken, async (req, res)=>{
        const email = req.params.email
        if(email !== req.decoded.email){
          return res.status(403).send({message: 'forbidden access'})
        }
        const query = {email: email}
        const user = await userCollection.findOne(query)
        let admin = false
        if(user){
          admin = user?.role === 'admin'
        }
        res.send({admin})
  
      })

      app.get('/users/mod/:email', verifyToken, async (req, res)=>{
        const email = req.params.email
        if(email !== req.decoded.email){
          return res.status(403).send({message: 'forbidden access'})
        }
        const query = {email: email}
        const user = await userCollection.findOne(query)
        let mod = false
        if(user){
          mod = user?.role === 'moderator'
        }
        res.send({mod})
  
      })

      app.patch('/users/admin/:id',verifyAdmin, verifyToken, async(req, res)=>{
        const id = req.params.id
        const filter = {_id : new ObjectId(id)}
        const updatedDoc ={
          $set: {
            role: 'admin'
          }
        }
        const result = await userCollection.updateOne(filter, updatedDoc)
        res.send(result)
      })

      app.patch('/users/mod/:id',verifyAdmin, verifyToken, async(req, res)=>{
        const id = req.params.id
        const filter = {_id : new ObjectId(id)}
        const updatedDoc ={
          $set: {
            role: 'moderator'
          }
        }
        const result = await userCollection.updateOne(filter, updatedDoc)
        res.send(result)
      })

       // stats or analytics
     app.get('/admin-stats', verifyToken,verifyAdmin, async (req, res) => {
      const users = await userCollection.estimatedDocumentCount();
      const products = await productCollection.estimatedDocumentCount();
      const reviews = await reviewCollection.estimatedDocumentCount();

     
      res.send({
        users,
        products,
        reviews
      })
    })
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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