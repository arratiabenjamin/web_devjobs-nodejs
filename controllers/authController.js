const passport = require("passport");
const mongoose = require('mongoose');
const Vacantes = mongoose.model('Vacantes');
const Usuarios = mongoose.model('Usuarios');
const crypto = require('crypto');
const envairEmail = require('../handlers/email');


exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage : 'Ambos campos son obligatorios'
})

exports.verificarUsuario = (req, res, next) => {

    if(req.isAuthenticated()){
        return next();
    }

    res.redirect('/iniciar-sesion');

}

exports.mostrarPanel = async (req, res) => {

    const vacantes = await Vacantes.find({ autor: req.user._id }).lean();
    
    res.render('administracion', {
        vacantes,
        nombrePagina: "Panel de Administración",
        tagline: "Crea y Administra tus Vacantes desde Aquí",
        cerrarSesion: true,
        imagen: req.user.imagen,
        nombre: req.user.nombre
    })
}

exports.cerrarSesion = (req, res, next) => {
    req.logout( function(err){
            if(err){
                return next(err);
            }

            req.flash('correcto', "Cerraste Sesion Correctamente");
            return res.redirect('/iniciar-sesion');
        }
    );

}

//Form Reestablecer Password
exports.formReestablecerPassword = (req, res) => {
    res.render('reestablecer-password', {
        nombrePagina: "Reestablecer Password",
        tagline: "Si ya tienes una cuenta pero olvidaste tu password, coloca tu email"
    });
}

//Generar el Token en Usuario
exports.enviarToken = async (req, res) => {
    const usuario = await Usuarios.findOne({ email: req.body.email });

    if(!usuario){
        req.flash('error', "No existe esa Cuenta");
        return res.redirect('/iniciar-sesion');
    }

    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000;

    await usuario.save();
    const resetUrl = `https://${req.headers.host}/reestablecer-password/${usuario.token}`;

    console.log(resetUrl);

    //Enviar Notificacion por Email
    await envairEmail.enviar({
        usuario,
        subject: "Password Reset",
        resetUrl,
        archivo: 'reset'
    });

    req.flash('correcto', "Revisa tu email para las indicaciones");
    res.redirect('/iniciar-sesion');
}

//Validacion de Token
exports.reestablecerPassword = async (req, res) => {
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now()
        }
    });

    if(!usuario){
        req.flash('error', "Formulario no Valido, Vuelve a Intentar");
        return res.redirect('/reestablecer-password');
    }

    res.render('nuevo-password', {
        nombrePagina: "Nuevo Password"
    });
}

exports.guardarPassword = async (req, res) => {
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now()
        }
    });

    if(!usuario){
        req.flash('error', "Formulario no Valido, Vuelve a Intentar");
        return res.redirect('/reestablecer-password');
    }

    usuario.password = req.body.password;
    usuario.token = undefined;
    usuario.expira = undefined;

    await usuario.save();

    req.flash('correcto', "Password Modificado Correctamente");
    res.redirect('/iniciar-sesion');
}