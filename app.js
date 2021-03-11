const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

// const listItems = [];
// const workItems = [];

app.set("view engine", "ejs");

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(express.static("public"));

mongoose.connect("mongodb://admin-rahul:rahul1999@cluster0-shard-00-00.1gwj9.mongodb.net:27017,cluster0-shard-00-01.1gwj9.mongodb.net:27017,cluster0-shard-00-02.1gwj9.mongodb.net:27017/todolistDB?ssl=true&replicaSet=atlas-e86syn-shard-0&authSource=admin&retryWrites=true&w=majority", { useNewUrlParser: true });

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item"
});

const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved default items to database");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                listItems: foundItems,
            });
        }
    });
});

// app.get("/work", function (req, res) {
//     res.render("list", {
//         listTitle: "Work List",
//         listItems: workItems,
//     });
// });

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                res.render("list", {
                    listTitle: foundList.name,
                    listItems: foundList.items,
                });
            }
        }
    });
});

app.post("/", function (req, res) {
    const itemName = req.body.newTodo;
    const listName = req.body.listSubmit;
    const item = new Item({
        name: itemName,
    });
    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (!err) {
                console.log("Successfully deleted checked item");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function(err, foundList){
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});

app.listen(3000, function () {
    console.log("Server running on port 3000.");
});
