const express = require("express");
const recordRoutes = express.Router();
const dbo = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

recordRoutes.route("/products").get(function(req, res) {
  let db_connect = dbo.getDb("products");
  let query = {};
  if (req.query.name) {
    query.name = req.query.name;
  }
  if (req.query.price) {
    query.price = req.query.price;
  }
  if (req.query.quantity) {
    query.quantity = req.query.quantity;
  }
  let sort = {};
  if (req.query.sortBy) {
    sort[req.query.sortBy] = req.query.sortOrder === 'asc' ? 1 : -1;
  }
  db_connect.collection("products").find(query).sort(sort).toArray(function(err, result) {
  if (err) throw err;
    res.json(result);
  });
});

recordRoutes.route("/products/add").post(async function(req, response) {
  let db_connect = dbo.getDb("products");
  let existingProduct = await db_connect.collection("products").findOne({ name: req.body.name });
  if (existingProduct) {
    return response.status(400).json({ error: "Product with this name already exists" });
  }
  let newProduct = {
    name: req.body.name,
    price: req.body.price,
    quantity: req.body.quantity
  };
  db_connect.collection("products").insertOne(newProduct, function(err, res) {
  if (err) throw err;
    response.json(res);
  });
});

recordRoutes.route("/products/:id").put(async function(req, response) {
  let db_connect = dbo.getDb("products");
  let id = req.params.id;
  let existingProduct = await db_connect.collection("products").findOne({ _id: ObjectId(id) });
  if (!existingProduct) {
    return response.status(404).json({ error: "Product with this id not found" });
  }
  let updatedProduct = {};
  if (req.body.name) {
    updatedProduct.name = req.body.name;
  }
  if (req.body.price) {
    updatedProduct.price = req.body.price;
  }
  if (req.body.description) {
    updatedProduct.description = req.body.description;
  }
  if (req.body.quantity) {
    updatedProduct.quantity = req.body.quantity;
  }
  if (req.body.unit) {
    updatedProduct.unit = req.body.unit;
  }
  db_connect.collection("products").updateOne({ _id: ObjectId(id) }, { $set: updatedProduct }, function(err, res) {
  if (err) throw err;
    response.json(res);
  });
});

recordRoutes.route("/products/:id").delete(async function(req, response) {
  let db_connect = dbo.getDb("products");
  let id = req.params.id;
  let existingProduct = await db_connect.collection("products").findOne({ _id: ObjectId(id) });
  if (!existingProduct) {
    return response.status(404).json({ error: "Product with this id not found" });
  }
  if(existingProduct.quantity==0){
    return response.status(400).json({ error: "product is not available in stock" });
  }
  db_connect.collection("products").deleteOne({ _id: ObjectId(id) }, function(err, res) {
  if (err) throw err;
    response.json(res);
  });
});

recordRoutes.route("/products/report").get(function(req, res) {
  let db_connect = dbo.getDb("products");
  db_connect.collection("products").aggregate([
  {
    $group: {
      _id: null,
      totalQuantity: { $sum: "$quantity" },
      totalValue: { $sum: { $multiply: ["$quantity", "$price"] } }
    }
  }
  ]).toArray(function(err, result) {
  if (err) throw err;
    res.json(result);
  });
});

module.exports = recordRoutes;
