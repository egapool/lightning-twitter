require('dotenv').config();
const express = require('express'),
  app = express(),
  config = require('config')
  session = require('express-session')
  passport = require('passport'),
  TwitterStrategy = require('passport-twitter'),
  Twitter = require('twitter'),
  client = require('./lnclient').client,
  http = require('http').Server(app),
  io = require('socket.io')(http),
  serveStatic = require('serve-static'),
  QRCode = require('qrcode'),
  db = require('./db'),
  bodyParser = require('body-parser')

app.set('views', __dirname + '/views')
app.set('view engine', 'ejs');
app.use(serveStatic(__dirname + '/public'))

passport.serializeUser((user, callback) => {
    callback(null, user);
});

passport.deserializeUser((obj, callback) => {
    callback(null, obj);
});

passport.use(new TwitterStrategy({
    consumerKey: config.get('twitter.consumerKey'),
    consumerSecret: config.get('twitter.consumerSecret'),
    callbackURL: config.get('twitter.callbackUrl')
},
(accessToken, accessTokenSecret, profile, callback) => {
    process.nextTick(() => {
        db.register(
          profile.id,
          profile.username,
          profile.displayName,
          1,
          accessToken,
          accessTokenSecret
         )
        return callback(null, profile);
    });
}));

app.use(session({
    secret: 'reply-analyzer',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

const server = http.listen(3000, function(){
    console.log("Node.js is listening to PORT:" + server.address().port);
});

app.get("/", function(req, res, next){
  db.getUsers((users) => {
    res.render('index.ejs',{users:users,loginUser:req.user});
  })
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback', passport.authenticate('twitter', {failureRedirect: '/login' }), (req, res) => {
    res.redirect('/'); 
});

app.post("/getInvoice", async (req, response, next) => {
  const opts = {
    errorCorrectionLevel: 'H',
    type: 'image/jpeg',
    rendererOpts: {
        quality: 0.3
    }
  }
  const pay_req = {
    value: 100
  }
  client.addInvoice(pay_req, async (err, res) => {
    console.log(res)
    const qr = await QRCode.toDataURL(res.payment_request, opts)
    res.qr = qr

    let user_id = req.body.user_id
    let tweet = req.body.tweet
    db.tweetRegister(
      user_id,
      tweet,
      res.payment_request,
      pay_req.value,
      null,
      0
      )
    response.json(res);
  });
});

app.post("/remove", async (req, response, next) => {
  // db.remove
  if (req.user) {
    db.removeUser(req.user.id, () => {
      // response.redirect('/')
    })
  }
  req.logout();
  response.redirect('/')
})

app.get("/getInfo", async (req, response, next) => {
  client.getInfo({}, async (err, res) => {
    response.json(res);
  });
});

const completed = async (invoice) => {
  // select tweet by invoice
  db.getTweet(invoice.payment_request, (tweet) => {
    db.updateTweet(invoice.payment_request)
    postTweet(tweet)
    io.emit('invoice_done', {
      invoiceId: invoice.add_index,
      payReq: invoice.payment_request,
      value: invoice.value,
    })
  })
}

const postTweet = async (tweet) => {
  db.getUser(tweet.user_id, (user) => {
    const twitterClient = new Twitter({
      consumer_key: config.get('twitter.consumerKey'),
      consumer_secret: config.get('twitter.consumerSecret'),
      access_token_key: user.access_token,
      access_token_secret: user.access_token_secret
    });
    tweet.tweet += "\nTweet by https://lntw.me #lntw"
    const params = {
      status: tweet.tweet,
    }
    twitterClient.post('statuses/update', params, function(error, tweets, response) {
      if (!error) {
        console.log(tweets);
      } else {
          console.log(error)
      }
    });
  })
}

let socketStore = {}
io.on('connection', (socket) => {
  socketStore[socket.id] = socket
  console.log('a user connected', socket.id);

  socket.on('disconnect', () => {
    delete socketStore[socket.id];
    console.log('user disconnected', socket.id);
  });
})

var call = client.subscribeInvoices({});
call.on('data', invoice =>  {
  // when a invoice is maked
  if (invoice.settled === false) {
    console.log('請求書が発行されました', '数量:' + invoice.value)

  } else {
    console.log('請求書に支払われました', invoice)
    completed(invoice)
  }
})
.on('end', function() {
  // The server has finished sending
    console.log('end!')
})
.on('status', function(status) {
  // Process status
  console.log("Current status" + status);
});