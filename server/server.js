const express = require('express');
const bodyParser = require('body-parser');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  const todo = new Todo({
    text: req.body.text
  });

  todo.save().then(doc => {
    res.send(doc);
  }, err => {
    res.status(400).send(err);
  })
  console.log(req.body);
});

app.post('/users', (req, res) => {
  const user = new User({
    email: req.body.email
  });

  user.save().then(user => {
    res.send(user);
  }, err => {
    res.status(400).send(err);
  })
  console.log(req.body);
});

app.listen(3000, () => {
  console.log('Started on port 3000');
});

module.exports = { app };