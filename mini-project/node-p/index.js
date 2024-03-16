const express = require('express')
const cors = require('cors')
const path=require('path');
const jwt=require('jsonwebtoken');
const multer = require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    }
  })
  
const upload = multer({ storage: storage })
const bodyParser = require('body-parser')
const app = express()
app.use('/uploads',express.static(path.join(__dirname,'uploads')));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const port = 4000
const mongoose= require ('mongoose');

mongoose.connect('mongodb://localhost:27017/mini')

const users= mongoose.model('Users',{
    username: String,
    password: String,
    likedProducts : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Products'}]
});
const Products= mongoose.model('Products',{pname: String, pdesc: String, price: String, category: String, pimage: String });
app.get('/',(req,res)=>{
    res.send("Hello World")
})

app.get('/search', (req,res)=>{

    let search =req.query.search;

    Products.find({
        $or:[
            { pname:{$regex: search}},
            { pdesc:{$regex: search}},
            { price:{$regex: search}},
        ]
    })
    .then((results)=>{
        res.send({ message: 'success', products: results})
    })
    .catch((err)=>{
        res.send({ message: 'server err'})
    })
})

app.post('/like-products',(req,res)=>{
    let productId = req.body.productId;
    let userId = req.body.userId;

    // console.log(req.body);

    users.updateOne({_id: userId }, { $addToSet: {likedProducts: productId} })
    .then(()=> {
        res.send({message:'liked success.'})
    })
    .catch(()=>{
        res.send({message:"server error"})
    })
})

app.post('/add-product', upload.single('pimage'),(req,res)=>{
    const pname =req.body.pname;
    const pdesc =req.body.pdesc;
    const price =req.body.price;
    const category =req.body.category;
    const pimage =req.file.path;

    const product= new Products({ pname, pdesc, price, category, pimage });
    product.save()
        .then(()=> {
            res.send({message:'saved success.'})
        })
        .catch(()=>{
            res.send({message:"server error"})
        })
})

app.get('/get-products', (req,res)=>{
    Products.find()
    .then((result)=>{
        res.send({ message: 'success', products: result})
    })
    .catch((err)=>{
        res.send({ message: 'server err'})
    })
})
 
app.post('/signup', (req,res)=>{

    const username =req.body.username;
    const password= req.body.password;
    const user = new users({username: username,password: password});
    user.save().then(()=> {
        res.send({message:'saved success.'})
    })
    .catch(()=>{
        res.send({message:"error"})
    })
})
app.post('/Liked-products', (req,res)=>{
    users.find({_id : req.body.userID}).populate('LikedProducts')
    .then((result)=>{
        res.send({ message: 'success', products: result})
    })
    .catch((err)=>{
        res.send({ message: 'server err'})
    })
})

app.post('/login', (req,res)=>{

    const username =req.body.username;
    const password= req.body.password;
    
    users.findOne({ username: username })
    .then((result)=>{
        if(!result){
            return res.send({ message: 'user not font.'})
        }
        else{
            if(result.password == password){
                const token= jwt.sign({ data: result
                },'MYKEY',{ expiresIn: '1h' });
                res.send({ message: 'find success', token: token, userId :result._id })
            }
            else{
                res.send({ message: 'Wrong password'})
            }
        }
        
    })
    .catch(()=>{
        req.send({ message: 'server error' })
    })
})

app.listen(port,()=>{
    console.log('Example is running on port ${port} ')
})


// npm i nodemon->to run the server continuesly