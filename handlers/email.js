const emailConfig = require("../config/email");
const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');
const util = require('util');

//Configuracion de Credenciales
let transport = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: false, // true for 465, false for other ports
    auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    }
})

//Utilizar el Template
transport.use(
    'compile',
    hbs({
      viewEngine: {
        extName: 'handlebars',
        partialsDir: __dirname + '/../views/emails',
        layoutsDir: __dirname + '/../views/emails',
        defaultLayout: ''
      },
      viewPath: __dirname + '/../views/emails',
      extName: '.handlebars'
    }))

exports.enviar = async (opciones) => {

    //Parametros del Mail
    const opcionesEmail = {
        from: 'devJobs <noreply@devjobs.com>',
        to: opciones.usuario.email,
        subject: opciones.subject,
        template: opciones.archivo,
        context: {
            resetUrl: opciones.resetUrl
        }
    }

    const sendMail = util.promisify(transport.sendMail, transport);
    return sendMail.call(transport, opcionesEmail);
}