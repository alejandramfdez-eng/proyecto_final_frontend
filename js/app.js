console.log("javascript");
const urlBase = "http://localhost:8000";

let currentMovieId = null;

function borrarCampos(){
    document.getElementById("comment-user").value = '';
    document.getElementById("comment-text").value = '';
    
    const estrellas = document.getElementById('stars-selector').querySelectorAll('.star-btn');
    estrellas.forEach(btn => btn.classList.remove('active'));
}

function mostrarFormulario(){
    borrarCampos();
    document.getElementById("movie-detail-section").style.display = "block";
    document.getElementById("movies-list-section").style.display = "none";
}

function ocultarFormulario(){
    document.getElementById("movie-detail-section").style.display = "none";
    document.getElementById("movies-list-section").style.display = "block";
}

let cerrar = document.getElementById("btn-back-to-list");
cerrar.addEventListener("click", ocultarFormulario);

let limpiarBuscador = document.getElementById("clear-inputs-btn");
limpiarBuscador.addEventListener("click", () => {
    document.getElementById('search-title').value = '';
    document.getElementById('search-year').value = '';
    document.getElementById('movies-list-section').innerHTML = '';
    document.getElementById('movies-list-section').style.display = "none";
    document.getElementById('movie-detail-section').style.display = "none";
});

function buscarPeliculas(){
    const title = document.getElementById('search-title').value.trim();
    const year = document.getElementById('search-year').value.trim();

    if (title === "") {
        alert('Por favor, ingresa un título de película');
        return;
    }

    let urlFinal = `${urlBase}/movies/search?title=${encodeURIComponent(title)}`;
    if (year !== "") {
        urlFinal += `&year=${year}`;
    }

    const listado = document.getElementById('movies-list-section');

    fetch(urlFinal)
    .then(response => response.json())
    .then(data => {
        let filas = ''; 
        
        if (data.Response === "True" && data.Search) {
            data.Search.forEach(element => {
                filas += ` 
                <div class="col">
                    <div class="card h-100 movie-card-item text-white p-2">
                        <img src="${element.Poster}" class="card-img-top rounded" style="height: 250px; object-fit: cover;">
                        <div class="card-body p-2 text-center">
                            <h6 class="card-title text-truncate fw-bold mb-2">${element.Title}</h6>
                            <button class="btn btn-sm btn-outline-info w-100 fw-bold text-dark" onclick="verDetallePelicula('${element.imdbID}')">Ver Detalle</button>
                        </div>
                    </div>
                </div>
                `;
            });
            
            listado.innerHTML = filas;
            listado.style.display = "flex";
        } else {
            alert('No se encontraron resultados');
            listado.style.display = "none";
        }
    }).catch(error => console.log("Error al cargar los datos: ", error));
}

let searchBtn = document.getElementById("search-btn");
searchBtn.addEventListener("click", buscarPeliculas);

function verDetallePelicula(idMovies){
    currentMovieId = idMovies;

    fetch(`${urlBase}/movies/${idMovies}/details`)
    .then(response => response.json())
    .then(movie => {
        if (movie.Response === "True") {
            document.getElementById('modal-info-block').innerHTML = `
                <h2 class="h3 mb-3 fw-bold text-light">${movie.Title} <span class="text-muted fs-5">(${movie.Year})</span></h2>
                <div class="d-flex justify-content-center mb-3">
                    <img src="${movie.Poster}" class="img-fluid rounded shadow border border-secondary" style="max-height: 320px;">
                </div>
                <p class="mb-2 small"><strong class="text-info">Sinopsis:</strong> ${movie.Plot}</p>
            `;

            mostrarComentarios();
            mostrarCalificaciones();
            mostrarFormulario();
        }
    }).catch(error => console.log("Error al recuperar el detalle: ", error));
}

function mostrarComentarios(){
    const container = document.getElementById('comments-list');
    
    fetch(`${urlBase}/movies/${currentMovieId}/comments`)
    .then(response => response.json())
    .then(data => {
        let filas = ''; 
        
        if (data.length === 0) {
            container.innerHTML = '<div class="alert alert-secondary text-center small">No hay comentarios aún.</div>';
            return;
        }

        data.forEach(element => {
            filas += `
            <div class="border-bottom border-secondary py-2" data-comment-id="${element.id}">
                <div class="d-flex justify-content-between align-items-start gap-2">
                    <div>
                        <h6 class="text-info small mb-0">👤 ${element.name} <span class="text-muted">(${element.date})</span></h6>
                        <p class="mb-0 text-white-50 small">${element.comment}</p>
                    </div>
                    <div class="d-flex gap-1">
                        <button type="button" class="btn btn-sm btn-outline-warning" data-action="edit-comment" data-id="${element.id}">Editar</button>
                        <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-comment" data-id="${element.id}">Eliminar</button>
                    </div>
                </div>
            </div>
            `;
        });

        container.innerHTML = filas;
    }).catch(error => console.log("Error al cargar comentarios: ", error));
}

function refrescoComentario(mensaje) {
    mostrarComentarios();
    alert(mensaje);
    document.getElementById("comment-text").value = '';
}

function altaComentario(e) {
    e.preventDefault();

    if (!currentMovieId) {
        alert('Error: No hay ninguna película seleccionada activa.');
        return;
    }

    const persona = document.getElementById('comment-user').value.trim();
    const comentarioTexto = document.getElementById('comment-text').value.trim();
    const fechaActual = new Date().toISOString().split('T')[0];

    if (persona === '' || comentarioTexto === '') {
        alert('Debes rellenar todos los campos');
        return;
    }

    fetch(`${urlBase}/movies/${currentMovieId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({id_movies: currentMovieId, name: persona, comment: comentarioTexto, date: fechaActual })
    })
    .then(response => {
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        refrescoComentario('¡Registro correcto!');
    })
    .catch(error => {
        console.error('Detalle error: ', error);
        alert('No se pudo guardar el comentario. Inténtalo de nuevo.');
    });
}

function mostrarCalificaciones(){
    fetch(`${urlBase}/movies/${currentMovieId}/qualifications`)
    .then(response => {
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        return response.json();
    })
    .then(data => {
        let promedio = 0;
        if (data && data.length > 0) {
            let suma = 0;
            data.forEach(q => suma += q.qualification);
            promedio = (suma / data.length).toFixed(1);
        }
        
        const promedioRedondeado = Math.round(promedio);

        const botonesEstrellas = document.getElementById('stars-selector').querySelectorAll('.star-btn');
        botonesEstrellas.forEach(btn => {
            const valorEstrella = parseInt(btn.getAttribute('data-value'));
            if (valorEstrella <= promedioRedondeado) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        document.getElementById('star-description-text').innerText = promedio > 0 
            ? `Promedio: ${promedio} / 5` 
            : "Sin calificaciones";

        const ratingsList = document.getElementById('ratings-list');
        ratingsList.innerHTML = data.map(rating => `
            <div class="d-flex justify-content-between align-items-center gap-2 border-bottom border-secondary py-2">
                <span class="small text-white-50">${rating.name}: ${rating.qualification}/5 (${rating.date})</span>
                <span class="d-flex gap-1">
                    <button type="button" class="btn btn-sm btn-outline-warning" data-action="edit-rating" data-id="${rating.id}">Editar</button>
                    <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-rating" data-id="${rating.id}">Eliminar</button>
                </span>
            </div>
        `).join('');
    }).catch(error => console.log("Error al cargar calificaciones: ", error));
}

function editarComentario(commentId) {
    fetch(`${urlBase}/movies/${currentMovieId}/comments`)
    .then(response => {
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        return response.json();
    })
    .then(comments => {
        const comment = comments.find(item => item.id === Number(commentId));
        if (!comment) throw new Error('Comentario no encontrado');

        const name = prompt('Nombre:', comment.name);
        if (name === null) return;
        const text = prompt('Comentario:', comment.comment);
        if (text === null) return;
        if (!name.trim() || !text.trim()) {
            alert('El nombre y el comentario no pueden quedar vacíos.');
            return;
        }

        return fetch(`${urlBase}/movies/${currentMovieId}/comments/${commentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_movies: currentMovieId,
                name: name.trim(),
                comment: text.trim(),
                date: comment.date
            })
        });
    })
    .then(response => {
        if (response && !response.ok) throw new Error(`Error HTTP: ${response.status}`);
        if (response) mostrarComentarios();
    })
    .catch(error => {
        console.error('Error al editar comentario:', error);
        alert('No se pudo editar el comentario.');
    });
}

function eliminarComentario(commentId) {
    if (!confirm('¿Eliminar este comentario?')) return;
    fetch(`${urlBase}/movies/${currentMovieId}/comments/${commentId}`, { method: 'DELETE' })
    .then(response => {
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        mostrarComentarios();
    })
    .catch(error => {
        console.error('Error al eliminar comentario:', error);
        alert('No se pudo eliminar el comentario.');
    });
}

function editarCalificacion(qualificationId) {
    fetch(`${urlBase}/movies/${currentMovieId}/qualifications`)
    .then(response => {
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        return response.json();
    })
    .then(ratings => {
        const rating = ratings.find(item => item.id === Number(qualificationId));
        if (!rating) throw new Error('Calificación no encontrada');

        const value = prompt('Calificación (1 a 5):', rating.qualification);
        if (value === null) return;
        const qualification = Number(value);
        if (!Number.isInteger(qualification) || qualification < 1 || qualification > 5) {
            alert('La calificación debe ser un número entero entre 1 y 5.');
            return;
        }

        return fetch(`${urlBase}/movies/${currentMovieId}/qualifications/${qualificationId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_movies: currentMovieId,
                name: rating.name,
                qualification,
                date: rating.date
            })
        });
    })
    .then(response => {
        if (response && !response.ok) throw new Error(`Error HTTP: ${response.status}`);
        if (response) mostrarCalificaciones();
    })
    .catch(error => {
        console.error('Error al editar calificación:', error);
        alert('No se pudo editar la calificación.');
    });
}

function eliminarCalificacion(qualificationId) {
    if (!confirm('¿Eliminar esta calificación?')) return;
    fetch(`${urlBase}/movies/${currentMovieId}/qualifications/${qualificationId}`, { method: 'DELETE' })
    .then(response => {
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        mostrarCalificaciones();
    })
    .catch(error => {
        console.error('Error al eliminar calificación:', error);
        alert('No se pudo eliminar la calificación.');
    });
}

function altaCalificacion(e) {
    if (!e.target.classList.contains('star-btn')) return;
    
    if (!currentMovieId) {
        alert('Error: No puedes calificar si no hay una película activa.');
        return;
    }

    const estrellasSeleccionadas = parseInt(e.target.getAttribute('data-value'));
    const persona = document.getElementById('comment-user').value.trim() || 'Anónimo';
    const fechaActual = new Date().toISOString().split('T')[0];

    fetch(`${urlBase}/movies/${currentMovieId}/qualifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_movies: currentMovieId, name: persona, qualification: estrellasSeleccionadas, date: fechaActual })
    })
    .then(response => {
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        mostrarCalificaciones();
        alert('¡Calificación registrada con éxito!');
    })
    .catch(error => {
        console.error('Detalle error: ', error);
        alert('No se pudo guardar la calificación. Inténtalo de nuevo.');
    });
}

let starsSelector = document.getElementById('stars-selector');
if (starsSelector) {
    starsSelector.addEventListener('click', altaCalificacion);
}

document.getElementById('comments-list').addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    if (button.dataset.action === 'edit-comment') editarComentario(button.dataset.id);
    if (button.dataset.action === 'delete-comment') eliminarComentario(button.dataset.id);
});

document.getElementById('ratings-list').addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    if (button.dataset.action === 'edit-rating') editarCalificacion(button.dataset.id);
    if (button.dataset.action === 'delete-rating') eliminarCalificacion(button.dataset.id);
});

let commentForm = document.getElementById('comment-form'); 
if (commentForm) {
    commentForm.addEventListener('submit', altaComentario);
}
