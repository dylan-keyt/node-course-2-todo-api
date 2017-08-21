const {ObjectID} = require('mongodb');
const {mongoose} = require('./../server/db/mongoose');
const {Todo} = require('./../server/models/todo');
const {User} = require('./../server/models/user');

const id = '599a76537cde171b9772ef74';

// if (!ObjectID.isValid(id)) {
//   console.log('ID not valid');
// }

// Todo.find({
//   _id: id
// }).then((todos) => {
//   console.log('todo', todos);
// });

// Todo.findOne({
//   _id: id
// }).then((todo) => {
//   if (!todo) {
//     return console.log('Id not found');
//   }
//   console.log('todo by id', todo);
// }).catch(err => console.log(err));

User.findById(id).then((user) => {
  if (!user) {
    return console.log('User not found');
  }
  console.log('User by id', user);
}).catch(err => {
  console.log('Invalid user id format');
});