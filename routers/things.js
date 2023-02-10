const express = require('express');
const app = express.Router();
const db = require('../db');
const client = db.client;

app.get('/', async(req, res, next)=> {
  try {
    const response = await client.query(`
      SELECT things.id, things.name, users.name as "userName"
      FROM things
      LEFT JOIN users
      ON users.id = things."userId"
    `);
    const things = response.rows;

    res.send(`
    <html>
      <head>
        <title>The Acme Things</title>
        <link rel='stylesheet' href='/public/styles.css' />
      </head>
      <body>
        <h1>The Acme Things</h1>
        <a href='/things/add'>Add Thing</a>
        <ul>
          ${
            things.map( thing => {
              return `
                <li>
                  <a href='/things/${thing.id}'>${ thing.name }</a>
                  belongs to ${ thing.userName || 'nobody' }
                </li>
              `;
            }).join('')
          }
        </ul>
      </body>
    </html>
    `);
  }
  catch(ex){
    console.log(ex);
    next(ex);
  }
});

app.delete('/:id', async(req, res, next)=> {
  try{
    const SQL = `
    DELETE FROM things
    WHERE id = $1
    `;
    await client.query(SQL, [ req.params.id ]);
    res.redirect('/things');
  }
  catch(ex){
    next(ex);
  }

});

app.post('/', async(req, res, next)=> {
  try{
    const SQL = `
  INSERT INTO things(name, description, "userId")
  VALUES ($1, $2, $3)
  RETURNING *
    `;
    const response = await client.query(SQL, [ req.body.name, req.body.description, req.body.userId || null]);
    const thing = response.rows[0];
    res.redirect(`/things/${thing.id}`);
  }
  catch(ex){
    next(ex);
  }

});

app.put('/:id', async(req, res, next)=> {
  try{
    const SQL = `
    UPDATE things
    SET name = $1, description = $2, "userId" = $3
    WHERE id = $4
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.description,
      req.body.userId || null,
      req.params.id
    ]);
    res.redirect(`/things/${req.params.id}`);
  }
  catch(ex){
    next(ex);
  }

});

app.get('/add', async(req, res, next)=> {
  try {
    const users = (await client.query('SELECT * FROM users')).rows;
      res.send(`
      <html>
        <head>
          <title>The Acme Things</title>
          <link rel='stylesheet' href='/public/styles.css' />
        </head>
        <body>
          <h1>The Acme Things</h1>
          <a href='/'>Show All Things</a>
          <form method='POST' action='/things'>
            <input name='name' placeholder='insert name' />
            <input name='description' placeholder='insert desc.' />
            <select name='userId'>
              <option value=''>-- choose a user -- </option>
              ${
                users.map( user => {
                  return `
                    <option value='${ user.id }'>${ user.name }</option>
                  `;
                }).join('')
              }
            </select>
            <button>Create</button>
          </form>
        </body>
      </html>
      `);
  }
  catch(ex){
    next(ex);
  }
});

app.get('/:id/edit', async(req, res, next)=> {
  try {
    const users = (await client.query('SELECT * FROM users')).rows;
    const response = await client.query(`
      SELECT things.*, users.name as "userName" 
      FROM things
      LEFT JOIN users
      ON things."userId" = users.id
      WHERE things.id = $1
    `, [ req.params.id ]);
    const thing = response.rows[0];
      res.send(`
      <html>
        <head>
          <title>The Acme Things</title>
          <link rel='stylesheet' href='/public/styles.css' />
        </head>
        <body>
          <h1>The Acme Things</h1>
          <a href='/'>Show All Things</a>
          <form method='POST' action='/things/${thing.id}?method=put' >
            <input value='${ thing.name }' name='name' placeholder='insert name' />
            <input value='${ thing.description }' name='description' placeholder='insert desc.' />
            <select name='userId'>
              <option value=''>-- choose a user -- </option>
              ${
                users.map( user => {
                  return `
                    <option ${ user.id === thing.userId ? 'selected' : ''} value='${ user.id }'>${ user.name }</option>
                  `;
                }).join('')
              }
            </select>
            <button>Update</button>
          </form>
        </body>
      </html>
      `);
  }
  catch(ex){
    next(ex);
  }
});

app.get('/:id', async(req, res, next)=> {
  try {
    const response = await client.query(`
      SELECT things.*, users.name as "userName" 
      FROM things
      LEFT JOIN users
      ON things."userId" = users.id
      WHERE things.id = $1
    `, [ req.params.id ]);
    const thing = response.rows[0];

    res.send(`
    <html>
      <head>
        <title>The Acme Things</title>
        <link rel='stylesheet' href='/public/styles.css' />
      </head>
      <body>
        <h1>The Acme Things</h1>
        <a href='/'>Show All Things</a>
        <h2>${ thing.name }</h2>
        <p>
          ${ thing.description}
        </p>
        owned by ${ thing.userName || 'nobody' }
        <a href='/things/${thing.id}?method=delete'>Delete</a>
        <a href='/things/${thing.id}/edit'>Edit</a>
      </body>
    </html>
    `);
  }
  catch(ex){
    console.log(ex);
    next(ex);
  }
});

module.exports = app;
