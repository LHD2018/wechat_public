const express = require("express");

const app = express();

const auth = require("./utils/auth");

const config = require("./config/config");

const Wechat = require('./utils/wechat');

const w_api = new Wechat();

app.use(auth(w_api));

app.listen(3000, () => console.log("server launched success..."));

