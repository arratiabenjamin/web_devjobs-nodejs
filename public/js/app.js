import axios from 'axios';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', () => {
    const skills = document.querySelector('.lista-conocimientos');

    //Eliminar Alertas
    let alertas = document.querySelector('.alertas');
    if (alertas) {
        eliminarAlertas();
    }

    if(skills){
        skills.addEventListener('click', agregarSkills);

        //Cuando estemos en editar llamar a la funcion
        skillsSeleccionados();
    }

    const vacantesListado = document.querySelector('.panel-administracion');

    if(vacantesListado){
        vacantesListado.addEventListener('click', accionesListado);
    }
});

const skills = new Set();

const agregarSkills = (e) => {
    if(e.target.tagName === 'LI'){
        if(e.target.classList.contains('activo')){
            skills.delete(e.target.textContent);
            e.target.classList.remove('activo');
        }else{
            skills.add(e.target.textContent);
            e.target.classList.add('activo');
        }
    }

    const skillsArray = [...skills]
    document.querySelector('#skills').value = skillsArray;
}

const skillsSeleccionados = () => {
    const seleccionados = Array.from(document.querySelectorAll('.lista-conocimientos .activo'));

    seleccionados.forEach(seleccionado => {
        skills.add(seleccionado.textContent);
    })

    // Añadirlo al Hidden
    const skillsArray = [...skills]
    document.querySelector('#skills').value = skillsArray;
}

const eliminarAlertas = () => {
    const alertas = document.querySelector('.alertas');
    const interval = setInterval(() => {
        if (alertas.children.length > 0) {
            alertas.removeChild(alertas.children[0]);   
        } else {
            alertas.parentElement.removeChild(alertas);
            clearInterval(interval);
        }
    }, 1500);
}

//Eliminar Vacantes
const accionesListado = e => {
    e.preventDefault();
    console.log(e.target.dataset);

    if(e.target.dataset.eliminar){
        
        //Eliminar por Axios
        Swal.fire({
            title: "Confirma Eliminacion?",
            text: "Luego de Eliminar no se recuperara nada",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si, Eliminar",
            cancelButtonText: "No, Cancelar"
          }).then((result) => {
            if (result.isConfirmed) {

                //Creacion URL
                const url = `${location.origin}/vacantes/eliminar/${e.target.dataset.eliminar}`;
                
                //Eliminar con Axios
                axios.delete(url, {params: {url}})
                    .then(function(respuesta){
                        if(respuesta.status === 200){
                            Swal.fire(
                                "Eliminado!",
                                respuesta.data,
                                "success"
                            );

                            //Eliminar del DOM
                            e.target.parentElement.parentElement.parentElement.removeChild(e.target.parentElement.parentElement)
                        }
                    })
                    .catch(() => {
                        Swal.fire({
                            type: "Error",
                            title: "Hubo un Error",
                            text: "No se pudo Eliminar"
                        });
                    })

            }
          });
    }else if(e.target.tagName === "A"){
        window.location.href = e.target.href;
    }
}