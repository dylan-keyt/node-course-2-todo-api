const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('./../server');
const { Todo } = require('./../models/todo');
const { User } = require('./../models/user');
const {todos, users, populateTodos, populateUsers} = require('./seed/seed.js');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('/todos', () => {
  describe('POST /todos', () => {
    it('should create a new todo', (done) => {
      const text = 'test task';
      request(app)
        .post('/todos')
        .set('x-auth', users[0].tokens[0].token)
        .send({text})
        .expect(200)
        .expect(res => {
          expect(res.body.text).toBe(text);
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          Todo.find({text}).then((todos) => {
            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
            done();
          }).catch(e => done(e));
        });
    });

    it('should not create a todo with invalid body data', (done) => {
      request(app)
        .post('/todos')
        .set('x-auth', users[0].tokens[0].token)
        .send({})
        .expect(400)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          Todo.find().then((todos) => {
            expect(todos.length).toBe(2);
            done();
          }).catch(e => done(e));
        });
    });
  });

  describe('GET /todos', () => {
    it('should get all todos', (done) => {
      request(app)
        .get('/todos')
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
          expect(res.body.todos.length).toBe(1);
        })
        .end(done);
    });
  });

  describe('GET /todos/:id', () => {
    it('should get a todo by its id', (done) => {
      request(app)
        .get(`/todos/${todos[0]._id.toHexString()}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
          expect(res.body.todo.text).toBe('first test todo');
        })
        .end(done);
    });

    it('should not get a todo created by another user', (done) => {
      request(app)
        .get(`/todos/${todos[1]._id.toHexString()}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
    });

    it('should return 404 if todo not found', (done) => {
      const id = new ObjectID().toHexString();
      request(app)
        .get(`/todos/${id}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
    });

    it('should return 404 if invalid object id', (done) => {
      const id = '123';
      request(app)
        .get(`/todos/${id}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
    });
  });

  describe('DELETE /todos/:id', () => {
    const hexId = todos[0]._id.toHexString();
    const text = 'first test todo';
    it('should delete a todo by its id', (done) => {
      request(app)
        .delete(`/todos/${hexId}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
          expect(res.body.todo.text).toBe(text);
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          Todo.findById(hexId).then(todo => {
            expect(todo).toNotExist();
            done();
          }).catch(e => done(e));
        });
    });

    it('should not delete a todo created by someone else', (done) => {
      const hexId = todos[0]._id.toHexString();
      const text = 'first test todo';

      request(app)
        .delete(`/todos/${hexId}`)
        .set('x-auth', users[1].tokens[0].token)
        .expect(404)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          Todo.findById(hexId).then(todo => {
            expect(todo).toExist();
            done();
          }).catch(e => done(e));
        });
    });

    it('should return 404 if todo not found', (done) => {
      const id = new ObjectID().toHexString();
      request(app)
        .delete(`/todos/${id}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
    });

    it('should return 404 if invalid object id', (done) => {
      const id = '123';
      request(app)
        .delete(`/todos/${id}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
    });
  });

  describe('UPDATE /todos/:id', () => {
    it('should update the todo', (done) => {
      const hexId = todos[0]._id.toHexString();
      const text = 'This should be the new text';

      request(app)
        .patch(`/todos/${hexId}`)
        .set('x-auth', users[0].tokens[0].token)
        .send({
          completed: true,
          text
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.todo.text).toBe(text);
          expect(res.body.todo.completed).toBe(true);
          expect(res.body.todo.completedAt).toBeA('number');
        })
        .end(done);
    });


    it('should clear completedAt when todo is not completed', (done) => {
      const hexId = todos[0]._id.toHexString();
      const text = 'This should be the new text';

      request(app)
        .patch(`/todos/${hexId}`)
        .set('x-auth', users[0].tokens[0].token)
        .send({
          completed: false,
          text
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.todo.text).toBe(text);
          expect(res.body.todo.completed).toBe(false);
          expect(res.body.todo.completedAt).toBe(null);
        })
        .end(done);
    });

  });
});

describe('users', () => {
  describe('GET users/me', () => {
    it('should return user if authenticated', done => {
      request(app)
        .get('/users/me')
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect(res => {
          expect(res.body._id).toBe(users[0]._id.toHexString());
          expect(res.body.email).toBe(users[0].email);
        })
        .end(done);
    });

    it('should return a 401 if not authenticated', done => {
        request(app)
        .get('/users/me')
        .expect(401)
        .expect(res => {
          expect(res.body).toEqual({});
        })
        .end(done);
    });

  });

  describe('POST /users', () => {
    it('should create a new user', (done) => {
      const email = 'example@example.com';
      const password = 'qwerty';
      request(app)
        .post('/users')
        .send({email, password})
        .expect(200)
        .expect(res => {
          expect(res.headers['x-auth']).toExist();
          expect(res.body._id).toExist();
          expect(res.body.email).toBe(email);
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          User.findOne({email}).then((user) => {
            expect(user).toExist();
            expect(user.email).toBe(email);
            expect(user.password).toExist();
            expect(user.password).toNotBe(password);
            done();
          }).catch(e => done(e));
        });
    });

    it('should not create a user with invalid body data', (done) => {
      request(app)
        .post('/users')
        .send({})
        .expect(400)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          User.find().then((users) => {
            expect(users.length).toBe(2);
            done();
          }).catch(e => done(e));
        });
    });

    it('should not create a user with duplicate email', (done) => {
      const email = 'dylan@example.com';
      const password = 'qwerty';
      request(app)
        .post('/users')
        .send({email, password})
        .expect(400)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          User.find().then((users) => {
            expect(users.length).toBe(2);
            done();
          }).catch(e => done(e));
        });
    });
  });

  describe('POST /users/login', () => {
    it('should login user and return auth token', (done) => {
      let token;
      request(app)
        .post('/users/login')
        .send({
          email: users[1].email,
          password: users[1].password
        })
        .expect(200)
        .expect((res) => {
          token = res.headers['x-auth'];
          expect(token).toExist();
        })
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          User.findById(users[1]._id).then((user) => {
            expect(user.tokens[1]).toInclude({
              access: 'auth',
              token
            });
            done();
          }).catch((e) => done(e));
        });
    });

    it('should reject invalid login', (done) => {
      request(app)
        .post('/users/login')
        .send({})
        .expect(400)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          User.findById(users[1]._id).then((user) => {
            expect(user.tokens.length).toBe(1);
            done();
          }).catch((e) => done(e));
        });
    });
  });

  describe('DELETE /users/me/token', () => {
    it('should delete a user auth token', (done) => {
      request(app)
        .delete(`/users/me/token`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          User.findById(users[0]._id).then((user) => {
            expect(user.tokens.length).toBe(0);
            done();
          }).catch((e) => done(e));
        });
    });

  });


});
