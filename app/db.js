require('dotenv').config();
const mysql      = require('mysql'),
  config = require('config')
var connection = mysql.createConnection({
  host: config.get("db.host"),
  user: config.get("db.user"),
  password : config.get("db.password"),
  database: config.get("db.database")
});

const register = async (tw_id, user_name, display_name, is_poster, access_token, access_token_secret) => {
  const param = [tw_id, user_name, display_name, is_poster, access_token, access_token_secret]
  connection.query("select * from users where tw_id = ?",[tw_id], (err,res,fields) => {
    if (res.length == 0) {
      connection.query("insert into users (`tw_id`,`screen_name`,`display_name`,`is_poster`,`access_token`,`access_token_secret`,created_at) values (?,?,?,?,?,?, now())", param, (error,results,fields) => {
        if (error) {
          console.log(error)
          return error
        }
        // console.log(error,results,fields)
      });
    }    // console.log(err,res)

  })
}

const tweetRegister = async (user_id,tweet,invoice,satoshi,from,done) => {
  const param = [user_id,tweet,invoice,satoshi,from,done]
  connection.query("INSERT INTO tweet (user_id,tweet,invoice,satoshi,`from`,done,created_at,updated_at) values (?,?,?,?,?,?,now(),now())", param, (err,res,fields) => {
      if (err) {
        console.log(err)
        return err
      }
  })
}

const getTweet = async (invoice, done) => {
  console.log(invoice)
  connection.query("SELECT * FROM tweet where invoice = ?",[invoice], (err,res,fields) => {
    if (err) {
      console.log(err)
      return err
    }
    if (done) {
      done(res[0])
    }
  })
}

const updateTweet = async (invoice) => {
  connection.query("UPDATE tweet SET done = 1 WHERE invoice = ?", [invoice], (error,results,fields) => {
    if (error) {
      console.log(error)
      return error
    }
  });
}

const getUser = async (user_id, done) => {
  console.log(user_id)
  connection.query("SELECT * FROM users where id = ?",[user_id], (err,res,fields) => {
    if (err) {
      console.log(err)
      return err
    }
    if (done) {
      done(res[0])
    }
  })
}
const getUsers = async (done) => {
  connection.query("SELECT * FROM users where is_poster = ?",[true], (err,res,fields) => {
    if (err) {
      console.log(err)
      return err
    }
    if (done) {
      done(res)
    }
  })
}

const removeUser = async (tw_id, done) => {
  console.log(tw_id)
  connection.query("DELETE FROM users WHERE tw_id = ?", [tw_id], (error,results,fields) => {
    if (error) {
      console.log(error)
      return error
    }
    if (done) {
      done()
    }
  });
}
module.exports = {
  register: register,
  tweetRegister: tweetRegister,
  getTweet: getTweet,
  updateTweet: updateTweet,
  getUser: getUser,
  getUsers: getUsers,
  removeUser: removeUser,
}
