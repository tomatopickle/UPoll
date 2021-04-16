var Datastore = require('nedb');
const express = require("express");
const bodyParser = require('body-parser');
const app = express();
const port = 4000;
const db = new Datastore({ filename:__dirname + '/db', autoload: true});
const { auth } = require('express-openid-connect');
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env["authSecret"],
  baseURL: 'https://upoll.abaanshanid.repl.co',
  clientID: process.env["authId"],
  issuerBaseURL: 'https://dev-ymaifzcs.us.auth0.com'
};
app.use(auth(config));
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.listen(port);
app.post("/api/new",function(req,res){
var labels = req.body.labels.split(",");
var votes = [];
for (var i=0;i<labels.length;i++){
 votes[i] = 0;
}
var d = new Date();
var n = d.getTime();
db.insert({hearts:0,labels:labels,title:req.body.pollName,votes:votes,voters:[],likers:[],time:n,noCapTitle:req.body.pollName.toLowerCase()}, function (err, newDoc) {
  res.redirect("/?"+newDoc._id);
});
});
app.post("/api/like",function(req,res){
  db.update({ _id: req.body.id }, { $addToSet: { likers: req.body.email } }, {}, function () {});
  db.findOne({_id:req.body.id},function(err,doc){
    if(!doc){
     res.end("404");
     return 
    };
    doc.hearts++
    db.update({_id:req.body.id}, { $set:{ hearts: doc.hearts }}, {}, function (e) {
      res.end("200")
    });
  });
})
app.get("/api/polls",function(req,res){
  db.find({},function(err,docs){
   res.setHeader('Content-Type', 'application/json');
   docs.sort(function(a, b) {
    return a.time - b.time;
   });
   var result = docs.sort();
   res.end(JSON.stringify(result.reverse()));
  });
});
app.get("/api/poll",function(req,res){
  db.findOne({_id:req.query.id},function(err,doc){
   res.setHeader('Content-Type', 'application/json');
   res.end(JSON.stringify(doc));
  });
});
app.post("/api/vote",function(req,res){
  db.update({ _id: req.body.id }, { $addToSet: { voters: req.body.email } }, {}, function () {});
  db.findOne({_id:req.body.id},function(err,doc){
    if(!doc){
     res.end("404");
     return 
    };
    doc.votes[req.body.index]++
    db.update({_id:req.body.id}, { $set:{ votes: doc.votes }}, {}, function (e) {
      res.end("200")
    });
  });
});
const { requiresAuth } = require('express-openid-connect');
app.get('/profile', requiresAuth(), (req, res) => {
  if(!req.oidc.isAuthenticated()){res.end("404");return}
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(req.oidc.user));
});
app.get("/api/loved",function(req,res){
  db.find({}).exec(function(err, docs) {
        docs.sort(function(a, b) {
          return a.hearts.length - b.hearts.length;
        });
        var result = docs.sort();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result.reverse()));
 });
});
app.get("/api/best",function(req,res){
  db.find({}).exec(function(err, docs) {
        docs.sort(function(a, b) {
          return a.hearts.length + a.voters.length - b.hearts.length + b.voters.length;
        });
        var result = docs.sort();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result.reverse()));
 });
});
app.get("/api/popular",function(req,res){
  db.find({}).exec(function(err, docs) {
        docs.sort(function(a, b) {
          return a.voters.length - b.voters.length;
        });
        var result = docs.sort();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result.reverse()));
 });
});
app.get("/api/search",function(req,res){
  db.find({noCapTitle:new RegExp(req.query.q.toLowerCase())},function(err,docs){
   res.setHeader('Content-Type', 'application/json');
   console.log(docs);
   res.end(JSON.stringify(docs));
  });
});