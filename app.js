//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require ("mongoose");
const _ = require("lodash");
const req = require("express/lib/request");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://Emilia:Test123@cluster0.d98fe.mongodb.net/todolistDB");

const itemSchema = new mongoose.Schema ({
  name : {
    type: String,
    required: true
  }
});

const Item = mongoose.model("Item", itemSchema);



const item2 = new Item ({
  name: "Hello. Use the + button to add a new item to your list"
});


const defaultItems = [item2];

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  items: [itemSchema]
});
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res){
 
  res.render("home")
});

app.get("/myLists", function(req, res){

  List.find({}, function(err, foundLists){
    if(err){
      console.log(err);
    }else{
    
      res.render("myLists", {listTitles: foundLists} );
    }
  });
 
});



app.get("/lists", function(req, res) {


  Item.find({}, function(err, foundItems){

    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err)
        }else {
          console.log("Successfully saved default items")
        }
      });
      res.redirect("/lists")

    }else {
  
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
      });

});

app.get("/lists/:listName", function(req, res){
  const requestedListName = _.capitalize(req.params.listName);

List.findOne({name: requestedListName}, function(err, foundList){
  if(!err){
    if(!foundList){
      //create a new list
      const list = new List ({
        name: requestedListName,
        items: defaultItems
      });
      list.save(function(err){
        if (!err) {
          res.redirect('/lists/' + requestedListName);
        }
      });
    }else {
      //found existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }
});

});

app.post("/", function(req, res){
  let newListName = _.capitalize(req.body.newList);

List.findOne({name: newListName}, function(err, foundListName){
  if(!err){
    if(!foundListName){
      //create a new list
      const list = new List ({
        name: newListName,
        items: defaultItems
      });
      list.save(function(err){
        if (!err) {
          res.redirect('/lists/' + newListName);
        }
      });
    }else {
      res.redirect('/lists/' + newListName);
    }
  } 
});
  
});


app.post("/lists", function(req, res){

  let itemName = req.body.newItem;
  let listName = req.body.list;

  const item = new Item( {
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect('/lists');
  } else if(listName === "myLists"){
    res.redirect('/myLists');
  } else{
    List.findOne({name: listName}, function(err, foundList){
      if(err){
        console.log(err);
      }else{
        foundList.items.push(item);

        foundList.save(function(err){
          if (!err) {
            res.redirect('/lists/' + listName);
          }
        });
       
      }
    });
  }
  });

app.post("/delete", function (req, res){
  let checkedItemId = req.body.checkbox;
  let listName = req.body.listName;

if(listName === "Today"){
  Item.findByIdAndRemove(checkedItemId, function(err){
    if(err){
      console.log(err);
    } else {
      console.log("Successfully removed checked item")
    }
    
  });
  res.redirect('/lists');
} else {
  List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
    if(!err){
      res.redirect("/lists/" + listName);
    }
  });
}
});

//deleting a list from myLists
app.post("/deleteList", function (req, res){
  let chosenListId = req.body.delete;

  List.findByIdAndRemove(chosenListId, function (err){
    if(err){
      console.log(err);
    }else {
      console.log("sucesfully removed list")
    }
  });
  res.redirect('/myLists');
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);


app.listen(port, function() {
  console.log("Server started sucessfully");
});
