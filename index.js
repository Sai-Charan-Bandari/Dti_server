//we actally need realtime db so that all hospitals,users get updates spontaneously
const exp = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const app = exp()
app.use(exp.json())
app.use(cors())
app.listen(7000,()=>console.log("listening at port 7000"))

mongoose.connect('mongodb://localhost:27017/DTI').then(()=>console.log('connected db')).catch(()=>console.log("error connecting db"))
let HospitalList = mongoose.model('HospitalList',new mongoose.Schema({ //list of all hospitals enrolled
    name:String , address:String, pincode:Number ,addresslink:String,hospitalid:String
}))
let PatientList = mongoose.model('PatientList',new mongoose.Schema({
    name:String,age:Number,gender:String ,bloodgroup:String,phone:Number, hospitalName:String, hospitalid:String //this id is used to fetch more details about the hospital
}))
let HospitalAccountList = mongoose.model('HospitalAccountList',new mongoose.Schema({ //it is a unique account held by each hospital management
    name:String, address:String, addresslink:String, uid:String, password:String, hospitalid:String, phone:Number, pincode:Number
}))
let UserAccountList = mongoose.model('UserAccountList',new mongoose.Schema({ 
    name:String, phone:Number, uid:String, password:String, bloodgroup:String, age:Number, address:String, pincode:Number, gender:String
}))

// app.get('/',(req,res)=>{
//     res.send('<h1>hello</h1>')
// })

//CREATION OF NEW ACCOUNT FOR USER
app.post('/user-account',async (req,res)=>{
    //data is received in lowercase only
    let obj =req.body
    // console.log("received ",obj)
    let k=await UserAccountList.findOne({uid:obj.uid})
    if(k) res.send('X')
    else{
    await new UserAccountList(obj).save()
    res.send({name:obj.name,phone:obj.phone,uid:obj.uid})
    }
})

//LOGIN FOR USER ACCOUNT
app.post('/user-account-login',async (req,res)=>{
    //data is received in lowercase only
    let obj =req.body
    let k=await UserAccountList.findOne({uid:obj.uid,password:obj.password})
    if(k) res.send({uid:obj.uid})
    else
    res.send('X')
})

//CHECKS IF USER ACCOUNT EXISTS .. USING UID
app.get('/validate-user-account/:uid',async(req,res)=>{
    let {uid}=req.params
    let k=await UserAccountList.findOne({uid})
    if(k){
        k.uid=''
        k.password=''
     res.send(k) 
    }
    else res.send('X')
})

//FETCHING HOSPITALS LIST 
app.get('/hospital-list',async(req,res)=>{
    let k=await HospitalList.find()
    if(k) res.send(k)
    else res.send('X')
})

//GET PATIENTS LIST
app.get('/patient-list/:hospitalid',async (req,res)=>{
    //data is received in lowercase only
    //obj contains name age gender phone bloodgrp of patient , hospital name and id are derived from url params
    let {hospitalid}=req.params
    console.log(hospitalid)
    if(hospitalid.startsWith('no')){
        //then it is not hospitalid...it is the limit/count of no.of patients data required by the home page
        let k=await PatientList.find().limit(parseInt(hospitalid.substring(2,hospitalid.length))).sort({$natural:-1})
        //above we used sort({$natural:-1}) to get the recent values first
        // console.log(k)
        if(k) res.send(k)
        else res.send('X')
    }else{
        let k=await PatientList.find({hospitalid}).sort({$natural:-1})
        // console.log('found hid')
        if(k) res.send(k)
        else res.send('X')
    }
})

//ADDING NEW PATIENT DETAILS
app.post('/add-patient/:hospitalName/:hospitalid',async (req,res)=>{
    // this data is posted into PatientList
    //data is received in lowercase only
    //obj contains name age gender phone bloodgrp of patient , hospital name and id are derived from url params

    let obj =req.body
    let {hospitalName,hospitalid}=req.params
    let k=await PatientList.findOne({name:obj.name,bloodgroup:obj.bloodgroup,hospitalid:hospitalid,gender:obj.gender,age:obj.age})
    //if patient already exists
    if(k) res.send('X')
    else{
        let k2=await new PatientList({...obj,hospitalid,hospitalName,hospitalid}).save() //append hospital data along with patient data
        //check val of k2
        if(k2) res.send(obj) //after receiving this response ... the state arr will be updated with the new obj in the website
    }
})

//REMOVING PATIENT DATA 
app.delete('/remove-patient/:hospitalid',async(req,res)=>{
    let {name,age,bloodgroup,phone,gender} =req.body
    let {hospitalid}=req.params
    let k=await PatientList.findOneAndDelete({name,age,bloodgroup,phone,gender,hospitalid})
    //if patient is found
    if(k) res.send(name)
    else res.send('X')
})

//UPDATING PATIENT DATA 
app.put('/update-patient/:hospitalid/:patientid',async(req,res)=>{
    let obj =req.body
    let {hospitalid,patientid}=req.params
    let k=await PatientList.findOneAndUpdate({_id:patientid,hospitalid:hospitalid},obj)
    //if patient is found
    if(k) res.send('Y')
    else res.send('X')
})

//CREATION OF NEW ACCOUNT FOR HOSPITAL
app.post('/hospital-account',async (req,res)=>{
    // this data is posted into HospitalList and HospitalAccountList
    //data is received in lowercase only
    let obj =req.body
    let k=await HospitalAccountList.findOne({hospitalid:obj.hospitalid})
    if(k) res.send('X')
    else{
    await new HospitalList({name:obj.name,address:obj.address,pincode:obj.pincode,addresslink:obj.addresslink,hospitalid:obj.hospitalid}).save()
    await new HospitalAccountList(obj).save()
    res.send({name:obj.name})
    }
//alt:
// HospitalList.insertMany([new HospitalList({name:'Apollo',address:'----'})])
// new HospitalList({name:'yess',address:'hammayya'}).save()
})

//LOGIN FOR HOSPITAL ACCOUNT
app.post('/hospital-account-login',async (req,res)=>{
    //data is received in lowercase only
    let obj =req.body
    let k=await HospitalAccountList.findOne({hospitalid:obj.hospitalid,uid:obj.uid,password:obj.password})
    //making sure to remove uid and password ... or making them empty
    if(k){
        k.uid=''; k.password='';
        res.send(k)
    } else
    res.send('X')
})

//CHECKS IF HOSPITAL ACCOUNT EXISTS .. USING HID
app.get('/validate-hospital-account/:hospitalid',async(req,res)=>{
    let {hospitalid}=req.params
    let k=await HospitalAccountList.findOne({hospitalid})
    if(k) res.send({name:k.name,address:k.address,addresslink:k.addresslink,pincode:k.pincode,phone:k.phone,hospitalid:k.hospitalid}) 
    else res.send('X')
})

