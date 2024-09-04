const API_URL = "https://api.themoviedb.org/3/movie/now_playing?api_key=ebea8cfca72fdff8d2624ad7bbf78e4c&page=";
let currentPage = 1;
let totalPages = 198;
let allMovies = [];
let favoriteMovies = JSON.parse(localStorage.getItem('favoriteMovies')) || [];

async function getMovies(page) {
    try {
        const resp = await fetch(`${API_URL}${page}`);
        if (!resp.ok) {
            throw new Error('Network response was not ok');
        }
        const respData = await resp.json();
        allMovies = respData.results;
        totalPages = respData.total_pages;
        showMovies(respData);
        updatePagination();
    } catch (error) {
        console.error('Failed to fetch movies:', error);
    }
}

function showFavoriteMovies() {
    const moviesEl = document.querySelector('.movies');
    moviesEl.innerHTML = ''; 

    if (favoriteMovies.length === 0) {
        moviesEl.innerHTML = '<h3>No favorite movies found.</h3>';
        return;
    }

    favoriteMovies.forEach(movie => {
        const movieEl = document.createElement('div');
        movieEl.classList.add("movie_container_favorite");
        movieEl.innerHTML = `
            <div class="movie_poster_favorite">
                <img src="https://image.tmdb.org/t/p/w342${movie.poster_path}" alt="${movie.original_title}">
            </div>
            <div class="movie_info_favorite">
                <h3>${movie.original_title}</h3>
                <p>${movie.overview}</p>
                <button class="favorite_button" data-id="${movie.id}">Unfavorite</button>
            </div>
        `;
        moviesEl.appendChild(movieEl);
    });
     document.querySelectorAll('.favorite_button').forEach(button => {
        button.addEventListener('click', (event) => {
            const movieId = parseInt(event.target.getAttribute('data-id'));
            favoriteMovies = favoriteMovies.filter(fav => fav.id !== movieId);
            localStorage.setItem('favoriteMovies', JSON.stringify(favoriteMovies));
            showFavoriteMovies();
        });
    });
}

function showMovies(data){
    const moviesEl = document.querySelector('.movies')
    moviesEl.innerHTML = '';

    data.results.forEach((movie) => {
        const movieEl = document.createElement('div')
        movieEl.classList.add("movie")
        movieEl.innerHTML = `
                        <div class="movie_cover_inner">
                    <img src="https://image.tmdb.org/t/p/w342${movie.poster_path}" alt="${movie.title}" class="movie_cover">
                    <div class="movie_cover_darkened"> </div>
                </div>`;

                movieEl.addEventListener("click", () => openModal(movie.id))
                moviesEl.appendChild(movieEl);
        
    })

};

function updatePagination() {
    const pageButtonsEl = document.getElementById('pageNumbers');
    pageButtonsEl.innerHTML = ''; 

    const totalPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(totalPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + totalPagesToShow - 1);

    if (endPage - startPage < totalPagesToShow - 1) {
        startPage = Math.max(1, endPage - totalPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('page-button');
        pageButton.disabled = i === currentPage; // Отключаем кнопку текущей страницы

        pageButton.addEventListener('click', () => {
            currentPage = i;
            getMovies(currentPage);
        });

        pageButtonsEl.appendChild(pageButton);
    }

    document.getElementById('first').disabled = currentPage === 1;
    document.getElementById('prev').disabled = currentPage === 1;
    document.getElementById('next').disabled = currentPage === totalPages;
    document.getElementById('last').disabled = currentPage === totalPages;
}

document.getElementById('first').addEventListener('click', () => {
    currentPage = 1;
    getMovies(currentPage);
});

document.getElementById('prev').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        getMovies(currentPage);
    }
});

document.getElementById('next').addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        getMovies(currentPage);
    }
});

document.getElementById('last').addEventListener('click', () => {
    currentPage = totalPages;
    getMovies(currentPage);
});


function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
}

function getYearFromDate(dateString) {
    const date = new Date(dateString);
    return date.getFullYear();
}

const modalEl = document.querySelector('.modal');

async function openModal(id) {
    const movie = allMovies.find(movie => movie.id === id);
    
    const ReleaseDate = formatDate(movie.release_date);
    const releaseYear = getYearFromDate(movie.release_date);
    const backdropUrl = `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`;

    modalEl.classList.add("modal_show");
    document.body.classList.add("scroll");

    modalEl.innerHTML = `
        <div class="modal_card">
            <div class="background" style="background-image: url('${backdropUrl}');"></div>
            <div style="position: relative; z-index: 1; color: white"> 
                <div class="modal_buttons">
                    <div>
                        <button type="button" class="modal_buttons_close">&lt; Back to list</button>
                    </div>
                    <div>
                        <button type="button" class="modal_buttons_next">Next Movie &gt;</button>
                    </div>
                </div>
                <div class="modal_under">
                    <div>
                        <img class="modal_poster" src="https://image.tmdb.org/t/p/w342${movie.poster_path}" alt="${movie.original_title}">
                    </div>
                    <div class="modal_info">
                        <button type="button" class="modal_button-favorite">${favoriteMovies.some(fav => fav.id === movie.id) ? 'Unfavorite' : 'Add to favorite'}</button>
                        <div class="modal_title"><h1>${movie.original_title} (${releaseYear})</h1></div>
                        <div class="modal_srr"><h3>
                            <span class="srr score">Score: ${movie.vote_average}</span>
                            <span class="srr count">Rating: ${movie.vote_count}</span> 
                            <span class="srr date">Release Date: ${ReleaseDate}</span>
                        </h3></div>
                        <div class="modal_overview">${movie.overview}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const btnClose = document.querySelector(".modal_buttons_close");
    btnClose.addEventListener("click", () => closeModal());

    const btnNext = document.querySelector(".modal_buttons_next");
    btnNext.addEventListener("click", () => {
        const nextMovie = allMovies[(allMovies.indexOf(movie) + 1) % allMovies.length];
        if (nextMovie) {
            openModal(nextMovie.id);
        }
    });

    const favoriteButton = document.querySelector('.modal_button-favorite');
    favoriteButton.addEventListener('click', () => {
        const isFavorite = favoriteMovies.some(fav => fav.id === movie.id);
        if (isFavorite) {
            favoriteMovies = favoriteMovies.filter(fav => fav.id !== movie.id);
            favoriteButton.textContent = 'Add to favorite';
        } else {
            favoriteMovies.push(movie);
            favoriteButton.textContent = 'Unfavorite';
        }
        localStorage.setItem('favoriteMovies', JSON.stringify(favoriteMovies));
    });
}

function closeModal() {
    modalEl.classList.remove("modal_show")
    document.body.classList.remove("scroll")
}

window.addEventListener ("keydown", (e) => {
    if (e.keyCode === 27) {
        closeModal()
    }
})

document.addEventListener('DOMContentLoaded', () => {
    getMovies(currentPage);

    document.getElementById('select').addEventListener('change', (event) => {
        const releasesHeader = document.querySelector('.releases'); 
        if (event.target.value === '1') {
            releasesHeader.textContent = 'My favorite movies';
            document.querySelector('.pagination').style.display = 'none'
            showFavoriteMovies();
        } else if (event.target.value === '2') {
            releasesHeader.textContent = 'Latest Releases';
            document.querySelector('.pagination').style.display = 'flex'; 
            getMovies(currentPage)
        }
    });
});

