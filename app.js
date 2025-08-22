if(process.env.NODE_ENV !== "production") {
require('dotenv').config();
}


const express = require('express');
const mongoose = require('mongoose');
const app = express();
const path=require("path");
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');
const session = require('express-session');
const MongoStore=require("connect-mongo");
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');

const listingsRouter= require('./routes/listing.js');
const reviewsRouter= require('./routes/review.js');
const userRouter = require("./routes/user.js");



//connect to mongodb
// const MONGO_URL =('mongodb://127.0.0.1:27017/wanderlust');

const dbUrl= process.env.ATLASDB_URl;

main()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error( err);
  });
async function main() {
    await mongoose.connect(dbUrl);

};
// //EJS-templating in views folder
app.set("view engine", "ejs");
app.set("views",path.join(__dirname,"views"));

app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));

//EJS-Mate
app.engine('ejs', ejsMate);

//static file-public folder
app.use(express.static("public"));
app.use(express.static(path.join(__dirname,"public"))); 


//connect-mongo
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
    touchAfter: 24 * 3600, // time period in seconds
});


store.on("error", () => {
  console.log("Session store error:", e);
}); 

//session middleware-This is used to store session data on the server side
const sessionOptions={
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie:{
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 day
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 day
    httpOnly: true, // prevents client-side JavaScript from accessing the cookie
  },
};






// app.get("/listings",(req,res)=>{
//     res.send("home-Hey there!");
// });

//session middleware
app.use(session(sessionOptions));
//flash middleware-This is used to store flash messages on the server side
app.use(flash());

//passport middleware
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())); 
//serialize and deserialize user
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentUser = req.user; // make currentUser available in all templates
  next();
});



//listing route
app.use("/listings", listingsRouter);
//review route
app.use("/listings/:id/reviews",reviewsRouter);
//user route
app.use("/", userRouter);


//404 route 
app.all("",(req,res,next)=>{
  next(new ExpressError(404,"Page not found!"));
});

//Error handling middleware
app.use((err,req,res,next)=>{
  let{statusCode=500,message="Something went wrong!"}= err;
  res.status(statusCode).render("error.ejs",{message});
});

//Server Starting
app.listen(3000 , ()=>{
    console.log("listening to port : 3000");
});








// app.get("/testListing",async(req,res)=>{
//     let sampleListing = new Listing({
//         title:"My new villa",
//         description:"This is a test listing",
//         price:1000,
//         location:"New York",
//         country:"USA",
//     });
//     await sampleListing.save();
//     console.log("Listing saved to DB");
//     res.send("successful testing");
// });

