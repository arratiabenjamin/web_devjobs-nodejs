const mongoose = require('mongoose');
require('dotenv').config({ path : 'variables.env' });

mongoose.connect(process.env.DB, {useNewUrlParser:true});

mongoose.connection.on('error', (error) => {
    console.log(error);
});

//Importar Models
require('../models/Vacantes.js')
require('../models/Usuarios.js')