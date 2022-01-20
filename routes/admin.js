var express = require('express');
const fileUpload = require('express-fileupload');
const collection = require('../config/collection');
var router = express.Router();
var addhelper = require("../helpres/add-helpers")

/* GET users listing. */
router.get('/', function(req, res, next) {
  addhelper.getAllProducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products})
  })
});
router.get('/add-products',(req,res,next)=>{
  res.render('admin/add')
})
router.post('/add-products',(req,res)=>{
  addhelper.addProduct(req.body,(id)=>{
    let image = req.files.image
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render('admin/add',{admin:true})
      }else{
        console.log(err)
      }
    })
  })
})
router.get('/delete-product/',(req,res)=>{
  let productId = req.query.id
  addhelper.deleteProduct(productId).then((result)=>{
    res.redirect('/admin')
    console.log(result);
    fileUpload.delete('./public/product-images/'+result+'.jpg')
  })
})
router.get('/edit-product/:id',async(req,res)=>{
  let productId = req.params.id
  let product = await addhelper.getProductDetails(req.params.id)
  console.log((productId));
  res.render('admin/edit',{product,admin:true})
})
router.post('/edit-products/:id',(req,res)=>{
  id = req.params.id
  addhelper.updateProduct(id,req.body).then((result)=>{
    res.redirect('/admin')
    if(req.files.image){
      let image = req.files.image
      image.mv('./public/product-images/'+id+'.jpg')
    }

  })
})


module.exports = router;
