const mongoose = require('mongoose');
require('./config/db.js');
const express = require('express');
//por buena convencion se escribe 'exphbs' por express y Handlebars
const exphbs = require('express-handlebars');
const path = require('path');
const router = require('./routes');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const passport = require('./config/passport');
const createError = require('http-errors');

require('dotenv').config({ path : 'variables.env' })

const app = express();

//Habilitar bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Habilitar handlebars como Template Engine
app.engine('handlebars',
    exphbs.engine({
        defaultLayout: 'layout',
        helpers: require('./helpers/handlebars')
    })
);
app.set('view engine', 'handlebars');

//Static Files
app.use(express.static(path.join(__dirname, 'public')))

app.use(cookieParser());

//Para no Iniciar en todo momento en la DB
app.use(session({
    secret: process.env.SECRET,
    key: process.env.KEY,
    resave: false, //No guardar la Sesion
    saveUninitialized: false, //Si el Usuario no hace nada NO la Guardara
    store: MongoStore.create({ mongoUrl: process.env.DB })
}));

//Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

//Alertas y flash messages
app.use(flash());

//Crear Middlewer
app.use((req, res, next) => {
    res.locals.mensajes = req.flash();
    next();
});

app.use('/', router());

// 404 No Existe Pagina
app.use((req, res, next) => {
    next(createError(404, 'Pagina no Encontrada'));
});

// Administracion Errores
app.use((error, req, res, next) => {
    const mensaje = error.message;

    const status = error.status || 500;
    res.locals.status = status;
    res.status(status);

    res.render('error', {
        nombrePagina: `Error ${status}`,
        tagline: mensaje
    });
});

//Dejar a Heroku El Puerto
const host = '0.0.0.0';
const port = process.env.PORT;
app.listen(port, host, () => {
    console.log('Servidor Corriendo.');
});

// app.listen(process.env.PORT);