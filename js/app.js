const API_KEY = 'ca48e3ef'; 
const BASE_URL = 'https://omdbapi.com';

const searchTitle = document.getElementById('search-title');
const searchYear = document.getElementById('search-year');
const searchBtn = document.getElementById('search-btn');
const clearInputsBtn = document.getElementById('clear-inputs-btn');
const movieDetailSection = document.getElementById('movie-detail-section');
const modalInfoBlock = document.getElementById('modal-info-block');
const commentForm = document.getElementById('comment-form');
const commentUser = document.getElementById('comment-user');
const commentText = document.getElementById('comment-text');
const commentsList = document.getElementById('comments-list');
const starsSelector = document.getElementById('stars-selector');
const starDescriptionText = document.getElementById('star-description-text');

let currentMovieId = null;

// Evento de búsqueda de películas
searchBtn.addEventListener('click', () => {
    const title = searchTitle.value.trim();
    const year = searchYear.value.trim();

    if (!title) {
        alert('Por favor, ingresa un título de película');
        return;
    }

    let url = `${BASE_URL}?apikey=${API_KEY}&t=${encodeURIComponent(title)}&plot=full`;
    if (year) url += `&y=${year}`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            return response.json();
        })
        .then(movie => {
            if (movie.Response === "True") {
                currentMovieId = movie.imdbID;
                
                // Si no hay póster disponible, usamos un placeholder moderno y estético
                const poster = movie.Poster !== 'N/A' ? movie.Poster : 'https://placehold.co';

                // SIMPLIFICACIÓN BOOTSTRAP: Estructura interna con utilidades nativas de texto, bordes y espaciados
                modalInfoBlock.innerHTML = `
                    <h2 class="h3 mb-3 fw-bold text-light">${movie.Title} <span class="text-muted fs-5">(${movie.Year})</span></h2>
                    <div class="d-flex justify-content-center mb-3">
                        <img src="${poster}" alt="${movie.Title}" class="img-fluid rounded shadow border border-secondary" style="max-height: 350px;">
                    </div>
                    <p class="mb-2"><strong class="text-info">Sinopsis:</strong> ${movie.Plot}</p>
                    <p class="mb-0"><strong class="text-info">Director:</strong> ${movie.Director}</p>
                `;

                mostrarComentarios(movie.imdbID);
                mostrarEstrellas(movie.imdbID);
                
                // REEMPLAZO BOOTSTRAP: Eliminamos .hidden personalizado por la clase nativa d-none
                movieDetailSection.classList.remove('d-none'); 
            } else {
                alert(`No se encontró: ${movie.Error}`);
                movieDetailSection.classList.add('d-none');
            }
        })
        .catch(error => console.error("Error de conexión: ", error));
});

// Limpieza de campos e interfaz
clearInputsBtn.addEventListener('click', () => {
    searchTitle.value = '';
    searchYear.value = '';
    currentMovieId = null;
    movieDetailSection.classList.add('d-none');
});

// Envío del formulario de comentarios
commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentMovieId) return;

    const nuevoComentario = {
        user: commentUser.value.trim() || 'Anónimo',
        text: commentText.value.trim(),
        date: new Date().toLocaleDateString()
    };

    const todosLosComentarios = JSON.parse(localStorage.getItem('movie_comments')) || {};
    if (!todosLosComentarios[currentMovieId]) todosLosComentarios[currentMovieId] = [];

    todosLosComentarios[currentMovieId].push(nuevoComentario);
    localStorage.setItem('movie_comments', JSON.stringify(todosLosComentarios));

    commentText.value = '';
    mostrarComentarios(currentMovieId);
});

// Renderizado dinámico de la lista de comentarios
function mostrarComentarios(imdbID) {
    commentsList.innerHTML = '';
    const todosLosComentarios = JSON.parse(localStorage.getItem('movie_comments')) || {};
    const comentarios = todosLosComentarios[imdbID] || [];

    if (comentarios.length === 0) {
        // REEMPLAZO BOOTSTRAP: Inyección de un componente de alerta estilizado e integrado
        commentsList.innerHTML = `
            <div class="alert alert-secondary p-2 text-center small mb-0" role="alert">
                No hay comentarios aún. ¡Sé el primero en dejar uno!
            </div>`;
        return;
    }

    // SIMPLIFICACIÓN JS: Usamos .map().join('') que es mucho más limpio que usar un bucle forEach y un acumulador vacío
    commentsList.innerHTML = comentarios.map(element => `
        <div class="list-group-item bg-transparent border-0 border-bottom border-secondary px-0 py-2">
            <div class="d-flex w-100 justify-content-between align-items-center">
                <h6 class="mb-1 text-info fw-bold small">${element.user}</h6>
                <small class="text-muted" style="font-size: 10px;">${element.date}</small>
            </div>
            <p class="mb-0 small text-light-50 text-wrap">${element.text}</p>
        </div>
    `).join('');
}

// Evento para el selector de estrellas
starsSelector.addEventListener('click', (e) => {
    if (!e.target.classList.contains('star-btn')) return;
    if (!currentMovieId) return;

    const valor = parseInt(e.target.getAttribute('data-value'));
    const todasLasCalificaciones = JSON.parse(localStorage.getItem('movie_ratings')) || {};
    todasLasCalificaciones[currentMovieId] = valor;
    localStorage.setItem('movie_ratings', JSON.stringify(todasLasCalificaciones));

    mostrarEstrellas(currentMovieId);
});

// Renderizado visual de las estrellas calificadas
function mostrarEstrellas(imdbID) {
    const todasLasCalificaciones = JSON.parse(localStorage.getItem('movie_ratings')) || {};
    const calificacion = todasLasCalificaciones[imdbID] || 0;

    starDescriptionText.innerText = calificacion > 0 ? `Tu calificación: ${calificacion} / 5` : "Haz clic en una estrella";

    // REEMPLAZO BOOTSTRAP: Cambiamos las clases a mano por utilidades de color nativas para iluminar/apagar
    const estrellas = starsSelector.querySelectorAll('.star-btn');
    estrellas.forEach(star => {
        const valor = parseInt(star.getAttribute('data-value'));
        if (valor <= calificacion) {
            star.classList.add('text-warning', 'active');
            star.classList.remove('text-muted');
        } else {
            star.classList.remove('text-warning', 'active');
            star.classList.add('text-muted');
        }
    });
}