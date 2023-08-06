require("dotenv").config()
const admin=require("firebase-admin");
const serviceAccount=require("./serviceAccountKey.json")
const express=require("express");
const app=express()
const cors=require("cors");
const bodyParser=require("body-parser");
const moment =require("moment");
const port =5000


app.use(express.json())
app.use(bodyParser.json());

const [basic,pro,business]=['price_1Nc1rFSBYuCzgLSGVRNtMQ4d','price_1Nc1tCSBYuCzgLSGx7rn7rva','price_1Nc1ueSBYuCzgLSGBOGf4kUk']


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://stripe-subscription-290c8-default-rtdb.firebaseio.com"
  });
  
app.use(
    cors({
        origin:"http://127.0.0.1:5173"
    })
)
const stripe=require("stripe")(process.env.STRIPE_PRIVATE_KEY)


// CREATE SUBSCRIPTION KEY

const stripeSession=async(plan)=>{
    try{
        const session=await stripe.checkout.sessions.create({
            mode:"subscription",
            payment_method_types:["card"],
            line_items:{
                price:plan,
                quantity:1
            },
            success_url:"http://127.0.0.1:5173/success",
            cancel_url:"http://127.0.0.1:5173/cancel",

        });
        return session;

    }catch(e){
        return e;

    }
};
app.post("/api/v1/create-subscription-checkout-session",async(req,res)=>{
    const {plan,customerId}=req.body;
    let planId=null;
    if(plan==99)planId=basic;
    else if(plan==499)planId=pro;
    else if(plan==999)planId=business;

    try{
        const session=await stripeSession(planId);
        const user=await admin.auth().getUser(customerId);
        await admin.database().ref("users").child(user.uid).update({
            subscription:{
                sessionId:session.id,
            }
        });
        console.log(session);
        return res.json({session});

    }catch(error){
        res.send(error)
    }
})


app.listen(port,()=>{
    console.log(`Now listening on port ${port}`);
    
})