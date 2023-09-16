const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const uuid = require("uuid");
const jwt = require("jsonwebtoken");
const db = require("../../lib/mariadb.js");

// Register new user
router.post("/sign-up", async (req, res) => {
  // Check if user already exists [can't have multiple accounts with same email]
  let result = await (
    await db
  ).query("SELECT * FROM user WHERE LOWER(email) = LOWER(?)", [req.body.email]);
  if (result.length) {
    return res.status(409).send({
      msg: "This email is already in use!",
    });
  } else {
    bcrypt.hash(req.body.password, 10, async (err, hash) => {
      // Catch error
      if (err) {
        return res.status(500).send({
          msg: err,
        });
      } else {
        // Password was hashed, add user to database
        await (
          await db
        ).query(
          "INSERT INTO user (user_id, password, registered, user_type, first_name, last_name, email, cellphone) VALUES (?, ?, now(), ?, ?, ?, ?, ?)",
          [
            uuid.v4(),
            hash,
            req.body.user_type,
            req.body.first_name,
            req.body.last_name,
            req.body.email,
            req.body.cellphone,
          ]
        );
        return res.status(201).send({
          msg: "Registered!",
        });
      }
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  // Check if user exists
  let result = await (await db)
    .query("SELECT * FROM user WHERE email = ?", [req.body.email])
    .catch((err) => {
      return res.status(409).send({
        msg: "Username or password is incorrect!",
      });
    });

  if (result.length === 0) {
    return res.status(409).send({
      msg: "Username or password is incorrect!",
    });
  } else {
    // Check password
    bcrypt.compare(
      req.body.password,
      result[0]["password"],
      async (bErr, bResult) => {
        // Wrong password
        if (bErr) {
          throw bErr;
        }
        if (bResult) {
          // Generate JWT token
          const token = jwt.sign(
            {
              email: result[0].email,
              userId: result[0].user_id,
            },
            "SECRETKEY",
            {
              expiresIn: "7d",
            }
          );
          // Set last login time
          await (
            await db
          ).query("UPDATE user SET last_login = now() WHERE user_id = ?", [
            result[0].user_id,
          ]);

          // Get user role
          userRole = await (
            await db
          ).query(
            "SELECT user_type FROM user WHERE user_id = ?",
            result[0].user_id
          );

          // Return succesful login
          return res.status(200).send({
            msg: "Logged in!",
            token: token,
            user_id: result[0].user_id,
            user_role: userRole[0].user_type,
          });
        }

        // Else return unsuccesful login
        return res.status(401).send({
          msg: "Username or password is incorrect!",
        });
      }
    );
  }
});

// Get list of first names and last names of homeowners of community
router.get("/homeowners", async (req, res) => {
  // Query SQL database
  let dbQuery = await (
    await db
  ).query(
    "select first_name, last_name, user_id from user where user_type like 'Homeowner'"
  );

  // Process into format for front end
  // Array of objects with user id and whole names
  newArray = [];
  for (const obj of dbQuery) {
    let wholeName = obj.first_name + " " + obj.last_name;
    let newObj = {
      name: wholeName,
      userId: obj.user_id,
    };
    newArray.push(newObj);
  }

  res.send(newArray);
});

// Get details of a specific user
router.get("/:id", async (req, res) => {
  // SQL query
  let dbquery = await (
    await db
  ).query("select * from user where user_id like ?", [req.params.id]);

  res.json(dbquery);
});

module.exports = router;
