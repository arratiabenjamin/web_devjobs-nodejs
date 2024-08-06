const mongoose = require('mongoose');
const Usuarios = mongoose.model('Usuarios');
const {body, validationResult} = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');

exports.subirImagen = (req, res, next) => {
    upload(req, res, function(error) {
        if(error){
            if(error instanceof multer.MulterError){
                if(error.code === 'LIMIT_FILE_SIZE'){
                    req.flash('error', "El Archivo es Muy Grande: Max 100kb");
                }else{
                    req.flash('error', error.message);
                }
            }else{
                req.flash('error', error.message);
            }

            res.redirect('/administracion');
            return;
        }else{
            next();
        }
    })

}

//Opciones Multer
const configuracionMulter = {
    limits: {fileSize: 100000},
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, __dirname + '../../public/uploads/perfiles')
        },
        filename: (req, file, cb) => {
            const extension = file.mimetype.split('/')[1];
            cb(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, cb) {
        if(file.mimetype === "image/jpeg" || file.mimetype === "image/jpg" || file.mimetype === "image/png"){
            cb(null, true);
        }else{
            cb(new Error('Formato no Valido'), false);
        }
    }
}

const upload = multer(configuracionMulter).single('imagen');

exports.formCrearCuenta = (req, res) => {
    res.render('crear-cuenta', {
        nombrePagina: "Crea tu cuenta en DevJobs",
        tagline: "Comienza a publicar tus vacantes gratis, solo debes crear una cuenta"
    })
}

exports.validarRegistro = async (req, res, next) => {
  //sanitizar los campos
    const rules = [
        body('nombre').not().isEmpty().withMessage('El nombre es obligatorio').escape(),
        body('email').isEmail().withMessage('El email es obligatorio').normalizeEmail(),
        body('password').not().isEmpty().withMessage('El password es obligatorio').escape(),
        body('confirmar').not().isEmpty().withMessage('Confirmar password es obligatorio').escape(),
        body('confirmar').equals(req.body.password).withMessage('Los passwords no son iguales')
    ];

    await Promise.all(rules.map(validation => validation.run(req)));
    const errores = validationResult(req);

    //si hay errores
    if (!errores.isEmpty()) {
        req.flash('error', errores.array().map(error => error.msg));
        res.render('crear-cuenta', {
            nombrePagina: 'Crea una cuenta en Devjobs',
            tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta',
            mensajes: req.flash()
        })
        return;
    }

    //si toda la validacion es correcta
    next();
}

exports.crearCuenta = async (req, res, next) => {
    const usuario = new Usuarios(req.body);

    try {
        const nuevoUsuario = await usuario.save();
        res.redirect("iniciar-sesion");
    } catch (error) {
        req.flash('error', error);
        res.redirect('/crear-cuenta');
    }

}

exports.formIniciarSesion = (req, res) => {
    res.render('iniciar-sesion', {
        nombrePagina: "Iniciar Sesion DevJobs"
    })
}

exports.formEditarPerfil = (req, res) => {
    res.render('editar-perfil', {
        nombrePagina: "Edita tu Perfil en DevJobs",
        usuario: req.user.toObject(),
        cerrarSesion: true,
        imagen: req.user.imagen,
        nombre: req.user.nombre
    })
}

exports.editarPerfil = async (req, res) => {
    const usuario = await Usuarios.findOne(req.user._id);

    usuario.nombre = req.body.nombre;
    usuario.email = req.body.email;
    if(req.body.password){
        usuario.password = req.body.password;
    }

    if(req.file){
        usuario.imagen = req.file.filename;
    }

    await usuario.save();

    req.flash('correcto', 'Cambios Guardados Correctamente')
    res.redirect('/administracion');
}

//Validacion y Sanitizacion de Creacion de Vacantes
exports.validarPerfil = async (req, res, next) => {
    const reglas = [
        body('nombre').not().isEmpty().withMessage('El Nombre es obligatorio').escape(),
        body('email').isEmail().withMessage('El Email es obligatorio').escape()
    ]
    
    //FALTA SANITIZAR PASSWORD

    await Promise.all(reglas.map((validation) => validation.run(req)));
    const errores = validationResult(req);

    if(!errores.isEmpty()){
        req.flash('error', errores.array().map((error) => error.msg))

        res.render('editar-perfil', {
            nombrePagina: "Edita tu Perfil en DevJobs",
            usuario: req.user.toObject(),
            cerrarSesion: true,
            imagen: req.user.imagen,
            nombre: req.user.nombre,
            mensajes: req.flash()
        })

        return;
    }

    next();
}