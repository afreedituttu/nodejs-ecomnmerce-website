var db = require('../config/connnection')
const bcrypt = require("bcrypt")
const collection = require('../config/collection')
const { USER_COLLECTIONS, CART, PRODUCT_COLLECTION, ORDER_COLLECTION } = require('../config/collection')
var objectId = require('mongodb').ObjectId
const { response } = require('express')
const { reject } = require('bcrypt/promises')
const async = require('hbs/lib/async')

module.exports={
    doSingup:(userData)=>{
        return new Promise(async(resolve,reject)=>{

            userData.password = await bcrypt.hash(userData.password,10)
            db.get().collection(collection.USER_COLLECTIONS).insertOne(userData).then(async(userdata)=>{
                resolve(userdata)
            }

            )
        })

    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let LoginStatus = false
            let response = {}

            let user = await db.get().collection(USER_COLLECTIONS).findOne({email:userData.email})


            if(user){
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                        response.user = user
                        response.status = true
                        resolve(response)
                    }else{

                        resolve({status:false})
                    }
                })
            }else{

                resolve({status:false})
            }
        })
    },
    addToCart:(ProductId,userId)=>{
        let proObj={
            item:objectId(ProductId),
            count:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(CART).findOne({user:objectId(userId)})
            if(userCart){
                let proExist = userCart.products.findIndex(product=> product.item==ProductId)
                console.log(proExist)
                if(proExist!=-1){
                    db.get().collection(CART).updateOne({user:objectId(userId),"products.item":objectId(ProductId)},{$inc:{'products.$.count':1}}).
                    then(()=>{
                        resolve()
                    })
                }else{
                db.get().collection(CART).updateOne({user:objectId(userId)},{
                $push:{products:proObj}
                }).then((result)=>{
                    resolve(result)
                })
                }
            }else{
                let cartrObj = {
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(CART).insertOne(cartrObj).then((response)=>{
                    console.log('here it is');
                    console.log(response);
                    resolve(response)
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems = await db.get().collection(CART).aggregate([
                {
                    $match:{user:objectId(userId)}
                },{
                    $unwind:'$products'
                },{
                    $project:{
                        item:'$products.item',
                        quantity:'$products.count'
                    }
                },{
                    $lookup:{
                        from:PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'
                    }
                },{$project:{
                    item:1,quantity:1,products:{$arrayElemAt:['$products',0]}
                }}
            ]).toArray()
            console.log(cartItems)
            totalPrice = 0
            cartItems.forEach(element => {
                EachTotalPrice = element.quantity*element.products.price
                console.log(EachTotalPrice);
                totalPrice = totalPrice + EachTotalPrice
                console.log(totalPrice);
            });
            cartItems.totalPrice = totalPrice
            console.log(cartItems);
            resolve(cartItems)
        })
    },
    changeProductQuantity:(details)=>{
        console.log(details.cart, details.product, details.count, details.quantity)
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(CART).updateOne({_id:objectId(details.cart),"products.item":objectId(details.product)},{
                    $pull:{products:{item:objectId(details.product)}}
                }).then((response)=>{
                    console.log("reached remove product")
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(CART).updateOne({_id:objectId(details.cart),"products.item":objectId(details.product)},{$inc:{'products.$.count':parseInt(details.count)}}).
                then(()=>{
                    resolve({removeProduct:false})
                })
            }
        })
    },
    getTotal:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems = await db.get().collection(CART).aggregate([
                {
                    $match:{user:objectId(userId)}
                },{
                    $unwind:'$products'
                },{
                    $project:{
                        item:'$products.item',
                        quantity:'$products.count'
                    }
                },{
                    $lookup:{
                        from:PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'
                    }
                },{$project:{
                    item:1,quantity:1,products:{$arrayElemAt:['$products',0]}
                }}
            ]).toArray()
            console.log(cartItems)
            totalPrice = 0
            cartItems.forEach(element => {
                EachTotalPrice = element.quantity*element.products.price
                console.log(EachTotalPrice);
                totalPrice = totalPrice + EachTotalPrice
                console.log(totalPrice);
            });
            console.log(cartItems);
            resolve(totalPrice)
        })
    },
    placeOrder:(order,products,total)=>{
        console.log('///////////////////');
        console.log(order["payment-method"]);
        return new Promise((resolve,reject)=>{
            console.log("im in here");
            console.log("here",order,products,total);
            let status = order["payment-method"]==='COD'?'placed':'pending'
            console.log(order["payment-method"], status);
            let orderObj={
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                },
                userId:objectId(order.user),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                status:status,
                date:new Date()
            }
            db.get().collection(ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                console.log('im in insert');
                db.get().collection(CART).remove({user:objectId(order.user)}).then((response)=>{
                    console.log('removed cart for user ',order.user);
                    resolve()
                })

            })
        })
    },
    getCartProductsList:(user)=>{
        return new Promise(async(resolve,reject)=>{
            console.log("im in getcartproductslist and user is ",user);
            let cart = await db.get().collection(CART).findOne({user:objectId(user)})
            console.log('latest',cart);
            resolve(cart.products)
        })
    },
    getOrders:(userId)=>{
        return new Promise((resolve,reject)=>{
            let orders = db.get().collection(ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
            resolve(orders)
        })
    },
    getOrderProducts:(id)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems = await db.get().collection(ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(id)}
                },{
                    $unwind:'$products'
                },{
                    $project:{
                        item:'$products.item',
                        quantity:'$products.count'
                    }
                },{
                    $lookup:{
                        from:PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'
                    }
                },{$project:{
                    item:1,quantity:1,products:{$arrayElemAt:['$products',0]}
                }}
            ]).toArray()
            console.log(orderItems)
            resolve(orderItems)
        })
    }

}