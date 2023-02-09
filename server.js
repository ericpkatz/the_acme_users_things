const express = require('express');
const app = express();
const db = require('./db');
const client = db.client;

app.use('/public', express.static('assets'));
app.use(express.urlencoded({ extended: false}));

app.use((req, res, next)=> {
  if(req.query.method){
    req.method = req.query.method;
  }
  next();
});

app.get('/', (req, res)=> res.redirect('/things'));

app.use('/things', require('./routers/things'));

const port = process.env.PORT || 3000;

app.listen(port, async()=> {
  try {
    console.log(`listening on port ${port}`);
    await client.connect();
    const SQL = `
    DROP TABLE IF EXISTS things;
    DROP TABLE IF EXISTS users;
    CREATE TABLE users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE
    );
    CREATE TABLE things(
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE,
      description TEXT,
      "userId" INTEGER REFERENCES users(id)
    );
    INSERT INTO users(name) VALUES ('moe');
    INSERT INTO users(name) VALUES ('larry');
    INSERT INTO users(name) VALUES ('lucy');
    INSERT INTO things(name, description) VALUES('foo', 'FOO!!');
    INSERT INTO things(name, description, "userId") VALUES('bar', 'BAR!!', (
      SELECT id
      FROM users
      WHERE name = 'lucy'
    ));
    INSERT INTO things(name, description, "userId") VALUES('bazz', 'BAZZ!!', (
      SELECT id
      FROM users
      WHERE name = 'lucy'
    ));
    `;
    await client.query(SQL);
  }
  catch(ex){
    console.log(ex);
  }
});
