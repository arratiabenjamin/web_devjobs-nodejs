exports.mostrarTrabajos = (req, res) => {
    res.render('home', {
        nombrePagina: 'devJobs',
        tagLine: 'Encuentra y Publica Trabajos para Desarrolladores Web.',
        barra: true,
        boton: true
    })
}