const mongoose = require("mongoose");
const shortid = require("shortid");
const slug = require("slug");
mongoose.Promise = global.Promise;

const vacantesSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: "El Titulo es Obligatorio",
        trim: true //Corta Espacios Inecesarios
    },
    empresa: {
        type: String,
        trim: true
    },
    ubicacion: {
        type: String,
        trim: true,
        required: "Ubicacion Obligatoria"
    },
    salario: {
        type: String,
        default: 0,
        trim: true
    },
    contrato: {
        type: String,
        trim: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    url: {
        type: String,
        lowercase: true
    },
    skills: [String],
    candidatos: [{
        nombre: String,
        email: String,
        cv: String
    }],
    autor : {
        type: mongoose.Schema.ObjectId,
        ref: 'Usuarios',
        required: "El Autor es Obligatorio"
    }
});

//Middelware
vacantesSchema.pre('save', function(next) {

    //Creacion URL
    const url = slug(this.titulo);
    this.url = `${url}-${shortid.generate()}`; //EJ: Node Developer = node-developer-6382791

    next();
});

//Indice
vacantesSchema.index({ titulo: 'text' });

module.exports = mongoose.model('Vacantes', vacantesSchema);