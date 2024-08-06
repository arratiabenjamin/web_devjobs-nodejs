const mongoose = require('mongoose');
const { debug } = require('webpack');
const Vacante = mongoose.model('Vacantes');
const {body, validationResult} = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');
const { cerrarSesion } = require('./authController');

exports.formNuevaVacante = (req, res) => {
    res.render('nueva-vacante', {
        nombrePagina: 'Nueva Vacante',
        tagline: 'Llena el formulario y publica tu vacante',
        cerrarSesion: true,
        imagen: req.user.imagen,
        nombre: req.user.nombre
    });
}

exports.agregarVacante = async (req, res) => {
    const vacante = new Vacante(req.body);

    //Autor de la Vacante
    vacante.autor = req.user._id;

    //Crear Arreglo de Skills
    vacante.skills = req.body.skills.split(",");

    //Almacenar en DB
    const nuevaVacante = await vacante.save();

    //Redireccion
    res.redirect(`/vacante/${nuevaVacante.url}`);
}

//Mostrar Vacante
exports.mostrarVacante = async (req, res, next) => {

    const vacante = await Vacante.findOne({url: req.params.url}).populate('autor').lean();

    if(!vacante) return next();

    res.render('vacante', {
        vacante, 
        nombrePagina : vacante.titulo,
        barra : true
    })

}

exports.formEditarVacante = async (req, res, next) => {

    const vacante = await Vacante.findOne({url: req.params.url}).lean();

    if(!vacante) return next();

    res.render('editar-vacante', {
        vacante, 
        nombrePagina : `Editar - ${vacante.titulo}`,
        cerrarSesion: true,
        imagen: req.user.imagen,
        nombre: req.user.nombre
    })

}

exports.editarVacante = async (req, res) => {
    const vacanteActualizada = req.body;

    //Crear Arreglo de Skills
    vacanteActualizada.skills = req.body.skills.split(",");

    //Almacenar en DB
    const vacante = await Vacante.findOneAndUpdate({url: req.params.url},
        vacanteActualizada,
        {
            new: true,
            runValidators: true
        }
    );

    //Redireccion
    res.redirect(`/vacante/${vacante.url}`);
}


//Validacion y Sanitizacion de Creacion de Vacantes
exports.validarVacante = async (req, res, next) => {

    //Sanitizar y Validar Campos
    const reglas = [
        body("titulo").not().isEmpty().withMessage("Agrega un Titulo a la Vacante").escape(),
        body("empresa").not().isEmpty().withMessage("Agrega una Empresa a la Vacante").escape(),
        body("ubicacion").not().isEmpty().withMessage("Agrega una Ubicacion a la Vacante").escape(),
        body("contrato").not().isEmpty().withMessage("Agrega un Tipo de Contrato a la Vacante").escape(),
        body("skills").not().isEmpty().withMessage("Agrega al menos 1 Skill a la Vacante").escape()
    ]
    await Promise.all(reglas.map((validation) => validation.run(req)))
    const errores = validationResult(req);

    if(!errores.isEmpty()){
        req.flash('error', errores.array().map((error) => error.msg));

        res.render('nueva-vacante', {
            nombrePagina: 'Nueva Vacante',
            tagline: 'Llena el formulario y publica tu vacante',
            cerrarSesion: true,
            nombre: req.user.nombre,
            mensajes: req.flash()
        });

        return;
    }

    next();
}

exports.eliminarVacante = async (req, res) => {
    const {id} = req.params;

    const vacante = await Vacante.findById(id);

    if(!vacante){
        res.status(404).send("Vacante no Encontrada");
    }else if(verificarAutor(vacante, req.user)){
        vacante.deleteOne();
        res.status(200).send("Vacante Eliminada Correctamente");
    }else{
        res.status(403).send("Error");
    }

}

const verificarAutor = (vacante = {}, usuario = {}) => {
    if(!vacante.autor.equals(usuario._id)){
        return false;
    }
    return true;
}


//Subir Archivos en PDF
exports.subirCV = (req, res, next) => {
    upload(req, res, function(error) {
        if(error){
            if(error instanceof multer.MulterError){
                if(error.code === 'LIMIT_FILE_SIZE'){
                    req.flash('error', "El Archivo es Muy Grande: Max 900kb");
                }else{
                    req.flash('error', error.message);
                }
            }else{
                req.flash('error', error.message);
            }

            res.back(''); // Regresa a la Pagina donde se Origina el Error.
            return;
        }else{
            next();
        }
    })
}


//Opciones Multer
const configuracionMulter = {
    limits: {fileSize: 900000},
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, __dirname + '../../public/uploads/cvs')
        },
        filename: (req, file, cb) => {
            const extension = file.mimetype.split('/')[1];
            cb(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, cb) {
        if(file.mimetype === "application/pdf"){
            cb(null, true);
        }else{
            cb(new Error('Formato no Valido'), false);
        }
    }
}

const upload = multer(configuracionMulter).single('cv');

//Almacenar Candidatos
exports.contactar = async (req, res, next) => {
    const vacante = await Vacante.findOne({url : req.params.url});

    if(!vacante) return next();

    const nuevoCandidato = {
        nombre: req.body.nombre,
        email: req.body.email,
        cv: req.file.filename
    }

    vacante.candidatos.push(nuevoCandidato);
    await vacante.save();

    req.flash('correcto', "Se Envio tu Curriculum Correctamente");
    res.redirect('/');
}


exports.mostrarCandidatos = async (req, res, next) => {
    const vacante = await Vacante.findById(req.params.id).lean();

    if(!vacante || vacante.autor != req.user._id.toString()){
        return next();
    }
    console.log(vacante.candidatos);
    res.render('candidatos', {
        nombrePagina: `Candidatos Vacante - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        candidatos: vacante.candidatos
    })
}


//Buscador de Vacantes
exports.buscarVacantes = async (req, res) => {
    const vacantes = await Vacante.find({
        $text: {
            $search: req.body.q
        }
    }).lean();

    console.log(req.body.q);
    console.log(vacantes);

    res.render('home', {
        nombrePagina: `Resultados Busqueda: ${req.body.q}`,
        barra: true,
        vacantes
    })
}