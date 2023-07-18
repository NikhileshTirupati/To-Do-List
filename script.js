const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const port = process.env.PORT;

mongoose.connect(
  "mongodb+srv://admin-nikhilesh:nikhileshtirupati@cluster0.rbuevtf.mongodb.net/todolistDB"
);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "Hit the + button to add a new item.",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {
  const results = await Item.find({});
  if (results.length === 0) {
    Item.insertMany(defaultItems)
      .then(() => {
        console.log("Succsessfully saved default items to DB.");
      })
      .catch((err) => {
        console.log(err);
      });
  }
  res.render("lists", { listTitle: "Today", newListItem: results });
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  const foundList = await List.findOne({ name: customListName });
  if (foundList === null) {
    const list = new List({
      name: customListName,
      items: defaultItems,
    });

    list.save();
    res.redirect("/" + customListName);
  } else {
    res.render("lists", {
      listTitle: foundList.name,
      newListItem: foundList.items,
    });
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.post("/", async function (req, res) {
  let itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName });
    foundList.items.push(newItem);
    foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", function (req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID).catch((err) => {
      console.log(err);
    });

    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemID } } }
    ).catch((err) => {
      console.log(err);
    });

    res.redirect("/" + listName);
  }
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});
