var db = require('../config/connnection')
var collection = require('../config/collection')
var path = require('path');
const { resolve } = require('path');
const { PRODUCT_COLLECTION } = require('../config/collection');
var objectId = require('mongodb').ObjectId

module.exports={
    addProduct:(products,callback)=>{
        console.log(products);
        db.get().collection('product').insertOne(products).then((result)=>{
            callback(result.insertedId);
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(PRODUCT_COLLECTION).deleteOne({_id:objectId(productId)}).then((result)=>{
                console.log(result)
                resolve(result.insertedId)
            })
        })
    },
    getProductDetails:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(PRODUCT_COLLECTION).findOne({_id:objectId(id)}).then((product)=>{
                console.log(product)
                resolve(product)
            })
        })
    },
    updateProduct:(id,details)=>{
        console.log('im at updt '+id);
        console.log(details);
        return new Promise((resolve,reject)=>{
            db.get().collection(PRODUCT_COLLECTION).updateOne({_id:objectId(id)},{
                $set:{
                    name:details.name,
                    discription:details.discription,
                    price:details.price,
                    category:details.category
                }
            })
            .then((result)=>{
                console.log('------------');
                console.log(result);
                resolve(result)
        })
        })
    }
}