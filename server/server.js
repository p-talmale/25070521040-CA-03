const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'sitSecA';
const COLLECTION = 'campusIssues';
const client = new MongoClient(MONGO_URI);
let issues;
app.get('/api/health', (req,res)=>res.json({ok:true, service:'CampusFix API'}));
app.get('/api/issues', async(req,res)=>{try{const data=await issues.find().sort({createdAt:-1}).toArray();res.json(data)}catch(e){res.status(500).json({error:'Unable to fetch issues'})}});
app.post('/api/issues', async(req,res)=>{try{const {title,category,location,description,reporterName,reporterEmail,priority}=req.body; if(!title||!category||!location||!description||!reporterName||!reporterEmail)return res.status(400).json({error:'Please complete all required fields.'});const doc={title:String(title).trim(),category,location:String(location).trim(),description:String(description).trim(),reporterName:String(reporterName).trim(),reporterEmail:String(reporterEmail).trim(),priority:['Low','Medium','High','Urgent'].includes(priority)?priority:'Medium',status:'Open',createdAt:new Date(),updatedAt:new Date()};const result=await issues.insertOne(doc);res.status(201).json({...doc,_id:result.insertedId})}catch(e){res.status(500).json({error:'Unable to create issue'})}});
app.put('/api/issues/:id',async(req,res)=>{try{if(!ObjectId.isValid(req.params.id))return res.status(400).json({error:'Invalid report ID'});const allowed=['title','category','location','description','reporterName','reporterEmail','priority','status'];const set={updatedAt:new Date()};for(const k of allowed)if(req.body[k]!==undefined)set[k]=req.body[k];if(set.status&&!['Open','In Progress','Resolved'].includes(set.status))return res.status(400).json({error:'Invalid status'});const result=await issues.updateOne({_id:new ObjectId(req.params.id)},{$set:set});if(!result.matchedCount)return res.status(404).json({error:'Report not found'});res.json(await issues.findOne({_id:new ObjectId(req.params.id)}))}catch(e){res.status(500).json({error:'Unable to update issue'})}});
app.delete('/api/issues/:id',async(req,res)=>{try{if(!ObjectId.isValid(req.params.id))return res.status(400).json({error:'Invalid report ID'});const result=await issues.deleteOne({_id:new ObjectId(req.params.id)});if(!result.deletedCount)return res.status(404).json({error:'Report not found'});res.json({success:true})}catch(e){res.status(500).json({error:'Unable to delete issue'})}});
async function start(){try{await client.connect();issues=client.db(DB_NAME).collection(COLLECTION);await issues.createIndex({createdAt:-1});await issues.createIndex({status:1,category:1});app.listen(PORT,()=>console.log(`CampusFix API running at http://localhost:${PORT}; MongoDB: ${DB_NAME}.${COLLECTION}`))}catch(e){console.error('Could not connect to MongoDB. Ensure MongoDB Server is running.',e.message);process.exit(1)}}
start();
