const { response } = require('express');
var express = require('express');
const async = require('hbs/lib/async');
var router = express.Router();
var addhelper = require("../helpres/add-helpers")
var userHelpers = require("../helpres/user-helpers")
const verifyLogin = (req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  let user = req.session.user
  console.log(user)
  addhelper.getAllProducts().then((products)=>{
    res.render('user/view-products',{admin:false,products,user})
});
})

router.get('/login',(req,res)=>{
  console.log('-----------');
  console.log(req.session.loggedIn);
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/login',{'loginErr':req.session.logginErr})
    req.session.logginErr = false
  }
})
router.get('/singup',(req,res)=>{
  res.render('user/singup')
})
router.post('/singup',(req,res)=>{
  dataReq = {
    email:req.body.email,
    password:req.body.password
  }
  userHelpers.doSingup(req.body).then((response)=>{
    userHelpers.doLogin(dataReq).then((response)=>{
      if(response.status){
        req.session.loggedIn=true
        req.session.user=response.user
        res.redirect('/')
      }else{
        res.redirect('/login')
      }
    })
  })
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.logginErr = true
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/login')
})
router.get('/cart',verifyLogin,async(req,res)=>{
  let products = await userHelpers.getCartProducts(req.session.user._id)
  res.render('user/cart',{products,"user":req.session.user})
})
router.get('/add-to-cart/:id',(req,res)=>{
  if(req.session.user){
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.redirect('/')
  })
  }else{
    res.redirect('/login')
  }
  })
router.post('/change-product-quantity',async(req,res,next)=>{
  console.log("new two");
  console.log(req.body);
  let total = await userHelpers.getTotal(req.body.user)
  userHelpers.changeProductQuantity(req.body).then((response)=>{
    response.total = total
    res.json(response)
  })
})

router.get('/place-order',verifyLogin,async(req,res)=>{
  console.log('latest');
  console.log(req.session.user._id);
  let total = await userHelpers.getTotal(req.session.user._id)
  res.render("user/order",{total,"user":req.session.user})
})
router.post('/place-order',verifyLogin,async(req,res)=>{
  console.log(req.body)
  let products = await userHelpers.getCartProductsList(req.body.user)
  console.log('p geted');
  let total = await userHelpers.getTotal(req.body.user)
  console.log('ttl geted');
  console.log("the products are : ",products);
  userHelpers.placeOrder(req.body,products,total).then((response)=>{
    res.send({status:true})
  })
router.get('/complete',verifyLogin,(req,res)=>{
  res.render('user/complete')
})
router.get('/view-order',verifyLogin,async(req,res)=>{
  console.log(req.session.user._id);
  let orders = await userHelpers.getOrders(req.session.user._id)
  console.log(orders);
  res.render('user/view-order',{orders})
})
router.get('/view-order-products/:id',verifyLogin,async(req,res)=>{
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{products})
})
})

module.exports = router;
    