const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const cookeParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookeParser());
console.log(process.env.DB_USER);

const uri = `mongodb+srv://carUser:QG0PGAB4EGE4MUfu@cluster0.mbzvmhe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const logger = async (req, res, next) => {
  console.log("called", req.host, req.originalUrl);
  next();
};

// const veryfytoken = async(req,res,next) =>{
//     const token = req.cookies?.token;
//     console.log('token',token);
//     if(!token){
//         return res.status(401).send({messege : 'Unauthrized'})
//     }
//     next()
// }

// const veryfyToken = async (req, res, next) => {
//   const token = req.cookies?.token;
//   console.log("value of token middlewer", token);
//   if (!token) {
//     return res.send({ messege: "unauthorized" });
//   }
//   jwt.verify(
//     token,
//     `f06199d8d9510cfb53e73c4f3caf533392bc632daf917235d0e4159574cefc0402dcb4f3758534d8b488874c83f24b86cd119757ab585a0b58f5c186240a264e`,
//     (err, decoded) => {
//       if (err) {
//         console.log(err);
//         return res.status(401).send({ messege: "not auth.." });
//       }
//       console.log("value in the decolded", decoded);
//       req.user = decoded;
//       next();
//     }
//   );
// };
const veryfyToken = async(req,res,next) =>{
    const token = req.cookies?.token;
    if(!token){
        return res.status(401).send({messege: 'NOt auth..'})
    }
    jwt.verify(token, `f06199d8d9510cfb53e73c4f3caf533392bc632daf917235d0e4159574cefc0402dcb4f3758534d8b488874c83f24b86cd119757ab585a0b58f5c186240a264e`,(err,decoded)=>{
        if(err){
            return res.status(401).send({messege:'error some or anything'})
        }
        req.user = decoded;
        next()
    })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db("carDoctor").collection("services");
    const bookingCollection = client.db("carDoctor").collection("bookings");

    // jwt auth related
    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(
        user,
        `f06199d8d9510cfb53e73c4f3caf533392bc632daf917235d0e4159574cefc0402dcb4f3758534d8b488874c83f24b86cd119757ab585a0b58f5c186240a264e`,
        {
          expiresIn: "1h",
        }
      );

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    // services related
    app.get("/services", logger, async (req, res) => {
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/services/:id", logger, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await servicesCollection.findOne(query);
      res.send(result);
    });

    // bookings
    app.get("/book", logger, veryfyToken, async (req, res) => {
      console.log(req.query);
      if(req.query.email !== req.user.email){
        return res.status(403).send({messege : 'forbidden access'})
      }
      console.log('valid user', req.user);
      //   console.log('tttt', req.cookies.token);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/book", veryfyToken, async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.delete("/book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/book/:id", async (req, res) => {
      const id = req.params.id;
      const updateBooking = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: updateBooking,
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
      console.log(updateBooking);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hio");
});

app.listen(port, () => {
  console.log(`runnng ${port}`);
});
