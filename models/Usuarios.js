const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const bcrypt = require("bcrypt");

const usuariosSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    nombre: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true,
        trim: true
    },
    token: String,
    expira: Date,
    imagen: String
})

//Hashear Password
usuariosSchema.pre("save", async function(next){
    //Si ya esta hasheado no haremos nada
    if(!this.isModified('password')){
        return next();
    }

    //Si no, lo hasheamos
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    next();

})
usuariosSchema.post("save", function(error, doc, next){
    if(error.name === "MongoServerError" && error.code === 11000){
        next("Este correo ya esta registrado.");
    }else{
        next(error);
    }
})

//Autenticar Usuarios
usuariosSchema.methods = {
    compararPassword: function(password) {
        return bcrypt.compareSync(password, this.password);
    }
}

module.exports = mongoose.model("Usuarios", usuariosSchema);