var express=require('express');
var bodyParser=require('body-parser')
var path=require('path');
var router=require('./router.js');
var models = require('./models');

var app=express();

app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, './node_modules')));
app.use(express.static(path.join(__dirname, './js')));
app.use(express.static(path.join(__dirname, './views')));
app.use(express.static(path.join(__dirname, './css')));

app.use('/', router);

//Syncing & Listening
models.db.sync({force: false})
.then(function () {
    app.listen(3000, function () {
        console.log('Server is listening on port 3000!');
    });
})
.catch(console.error);
