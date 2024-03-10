// import { DB_URL } from "../secrets/config.js";
import express from "express";
import ViteExpress from "vite-express"
// ---------------------
import axios from "axios";
import path from "path"
import bcrypt from "bcrypt";
import { Int32, MongoClient, ObjectId, ServerApiVersion } from "mongodb"

//# EXPRESS + VITE SETUP
const app = express();
app.use(express.json())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

ViteExpress.listen(app, 3000, () =>
console.log("Server is active on http://localhost:3000/")
);

//# MONGO DB SETUP
const mongo = new MongoClient("mongodb+srv://Juanito:3gaDE9iMO3BIeGVh@cluster0.2duv9fo.mongodb.net/?retryWrites=true&w=majority", {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

await mongo.connect();
console.log("MongoDB connected successully ✅");
const db = mongo.db("SIlent_Auction");
const usersDB = db.collection("users")
const itemsDB = db.collection("items")


app.post("/api/sign-in", async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    const _id = req.body._id
    const email = req.body.email
    const name = req.body.name

    // create and store password hash
    bcrypt.hash(req.body.password, 10).then((hashResponse) => {
        usersDB.insertOne({_id: _id, email: email, name: name, hash: hashResponse}).then((dbResponse) => {
            console.log(dbResponse.insertedId)
            console.log(dbResponse.insertedId.toString())
            res.send(dbResponse.insertedId.toString())
        })
    });
})

app.post("/api/create-item", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");


    const itemName = req.body.itemName;
    const itemDescription = req.body.itemDescription;
    const itemWorth = req.body.itemWorth;
    const startingBid = req.body.startingBid;

    itemsDB.insertOne({
        itemName: itemName,
        itemDescription: itemDescription,
        itemWorth: itemWorth,
        bids: [{
            user: 0,
            amount: new Int32(startingBid),
            date: new Date()
        }]
    }).then((dbResponse) => {
        res.send(dbResponse.insertedId)
    })
})

app.post("/api/get-items", async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    itemsDB.find().toArray().then((response) => {
        res.send(response)
    })
})

app.post("/api/bid", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    console.log(req.body)
    const itemId = req.body.itemId
    const userId = req.body.userId
    const amount = req.body.amount

    const newBid = {
        user: userId,
        amount: new Int32(amount),
        date: new Date()
    }

    itemsDB.updateOne({_id: new ObjectId(itemId)}, {$push: {bids: newBid}}).then((res) => {
        console.log(res)
    })
});

app.post("/api/remove-bid", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    const itemId = req.body.itemId
    const amount = req.body.amount
    const userId = req.body.userId

    itemsDB.updateOne({_id: new ObjectId(itemId)}, {$pull: {
        bids: {
            user: userId,
            amount: amount
        }
    }}).then((response) => {
        console.log(response)
    }).catch(err => {
        console.log(err)
    })
})