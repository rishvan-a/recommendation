// su.js

const TMDB_API_KEY = '3ce92aa806b4c527acf526324f6cd8e9';
const SPOTIFY_CLIENT_ID = 'aa174295d12a44268ce575f5da0a41c0';
const SPOTIFY_CLIENT_SECRET = '970750adf4d140b9b3befa40289f7cbc';
const RAWG_API_KEY = 'b174464b232e4981a07528ad781c29b8';

// Fetch Spotify Access Token
async function getSpotifyToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

// Apply Movie Filters
async function applyMovieFilters() {
    const genre = document.getElementById('movie-genre').value;
    const year = document.getElementById('movie-year').value;
    const language = document.getElementById('movie-language').value;

    const queryParams = [];
    if (genre) queryParams.push(`with_genres=${genre}`);
    if (year) queryParams.push(`primary_release_year=${year}`);
    if (language) queryParams.push(`with_original_language=${language}`);

    const queryString = queryParams.length ? `&${queryParams.join('&')}` : '';
    await fetchMovieRecommendations(queryString);
}

// Fetch Movie Recommendations with Filters
async function fetchMovieRecommendations(filters = '') {
    const searchTerm = document.getElementById('search').value;
    const url = searchTerm 
        ? `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(searchTerm)}`
        : `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=en-US${filters}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch movie recommendations');
    const data = await response.json();
    displayRecommendations(data.results, 'movie-recommendations');
}

// Apply Song Filters
async function applySongFilters() {
    const genre = document.getElementById('song-genre').value;
    const language = document.getElementById('song-language').value;

    const query = genre ? `&q=genre:${genre}` : '';
    const langFilter = language ? `&q=language:${language}` : ''; // Construct language filter

    await fetchSongRecommendations(query + langFilter);
}

// Fetch Song Recommendations with Filters or Search
async function fetchSongRecommendations(query = '') {
    const token = await getSpotifyToken();
    const searchTerm = document.getElementById('search').value;

    const url = searchTerm 
        ? `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(searchTerm)}&limit=10`
        : `https://api.spotify.com/v1/search?type=track${query}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch song recommendations');
    const data = await response.json();
    displayRecommendations(data.tracks.items, 'song-recommendations', 'track');
}

// Apply Game Filters
async function applyGameFilters() {
    const genre = document.getElementById('game-genre').value;
    const query = genre ? `&genres=${genre}` : '';
    await fetchGameRecommendations(query);
}

// Fetch Game Recommendations with Filters
async function fetchGameRecommendations(query = '') {
    const searchTerm = document.getElementById('search').value;
    const url = searchTerm 
        ? `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page_size=10&search=${encodeURIComponent(searchTerm)}`
        : `https://api.rawg.io/api/games?key=${RAWG_API_KEY}${query}&page_size=10`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch game recommendations');
    const data = await response.json();
    displayRecommendations(data.results, 'game-recommendations');
}

// Display Recommendations
function displayRecommendations(items, elementId, type = 'media') {
    const container = document.getElementById(elementId);
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = '<p>No results found.</p>';
        return;
    }

    items.forEach(item => {
        const recommendationDiv = document.createElement('div');
        recommendationDiv.classList.add('recommendation-item');
        
        let imageUrl;

        // Handle image URL based on type
        if (type === 'track') {
            imageUrl = item.album.images[0]?.url || 'default_image_url.jpg'; // Added fallback image
            recommendationDiv.addEventListener('click', () => fetchDetail(item, 'track'));
        } else if (item.poster_path) {
            imageUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
            recommendationDiv.addEventListener('click', () => fetchDetail(item, 'movie'));
        } else if (item.background_image) {
            imageUrl = item.background_image;
            recommendationDiv.addEventListener('click', () => fetchDetail(item, 'game'));
        } else {
            imageUrl = 'default_image_url.jpg'; // Placeholder for missing image
        }

        recommendationDiv.innerHTML = `
          <img src="${imageUrl}" alt="${item.name || item.title || 'Media'}">
          <h3>${item.name || item.title || 'Untitled'}</h3>
        `;

        container.appendChild(recommendationDiv);
    });
}

// Fetch detailed information for selected item
async function fetchDetail(item, type) {
    let detailData;
    try {
        if (type === 'track') {
            const token = await getSpotifyToken();
            const response = await fetch(`https://api.spotify.com/v1/tracks/${item.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            detailData = await response.json();
        } else if (type === 'movie') {
            const response = await fetch(`https://api.themoviedb.org/3/movie/${item.id}?api_key=${TMDB_API_KEY}&language=en-US`);
            detailData = await response.json();
        } else if (type === 'game') {
            const response = await fetch(`https://api.rawg.io/api/games/${item.id}?key=${RAWG_API_KEY}`);
            detailData = await response.json();
        }
        displayDetail(detailData, type);
    } catch (error) {
        document.getElementById('detail-content').innerHTML = '<p>Failed to load details. Please try again later.</p>';
    }
}

// Show Modal with Detailed Information
function showModal() {
    const modal = document.getElementById('detail-modal');
    modal.style.display = 'block';
}

// Hide Modal
function closeModal() {
    const modal = document.getElementById('detail-modal');
    modal.style.display = 'none';
}

// Fetch detailed information for selected item
async function fetchDetail(item, type) {
    let detailData;
    try {
        if (type === 'track') {
            const token = await getSpotifyToken();
            const response = await fetch(`https://api.spotify.com/v1/tracks/${item.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            detailData = await response.json();
        } else if (type === 'movie') {
            const response = await fetch(`https://api.themoviedb.org/3/movie/${item.id}?api_key=${TMDB_API_KEY}&language=en-US`);
            detailData = await response.json();
        } else if (type === 'game') {
            const response = await fetch(`https://api.rawg.io/api/games/${item.id}?key=${RAWG_API_KEY}`);
            detailData = await response.json();
        }
        displayDetail(detailData, type);
    } catch (error) {
        showError('detail-content', 'Failed to load details. Please try again later.');
    }
}

// Display Detailed Information
function displayDetail(data, type) {
    const detailContent = document.getElementById('detail-content');
    detailContent.innerHTML = '';

    if (type === 'track') {
        const imageUrl = data.album.images[0]?.url || 'default_image_url.jpg';
        detailContent.innerHTML = `
            <h3>${data.name}</h3>
            <p>Artist: ${data.artists.map(artist => artist.name).join(', ')}</p>
            <img src="${imageUrl}" alt="${data.name}">
            <p>Album: ${data.album.name}</p>
            <p>Release Date: ${data.album.release_date}</p>
            <p>Duration: ${Math.floor(data.duration_ms / 60000)} min ${Math.round((data.duration_ms % 60000) / 1000)} sec</p>
        `;
    } else if (type === 'movie') {
        detailContent.innerHTML = `
            <h3>${data.title}</h3>
            <p>Release Date: ${data.release_date}</p>
            <p>Overview: ${data.overview}</p>
            <img src="https://image.tmdb.org/t/p/w500${data.poster_path}" alt="${data.title}">
        `;
    } else if (type === 'game') {
        detailContent.innerHTML = `
            <h3>${data.name}</h3>
            <p>Release Date: ${data.released}</p>
            <p>Rating: ${data.rating}</p>
            <p>Overview: ${data.description_raw}</p>
            <img src="${data.background_image || 'default_image_url.jpg'}" alt="${data.name}">
        `;
    }

    showModal(); // Show the modal after populating it
}

// Close the modal when the close button is clicked
document.getElementById('close-modal').addEventListener('click', closeModal);

// Close the modal when clicking outside of the modal
window.onclick = function(event) {
    const modal = document.getElementById('detail-modal');
    if (event.target === modal) {
        closeModal();
    }
};


// Show Error if API call fails
function showError(elementId, message) {
    const container = document.getElementById(elementId);
    container.innerHTML = `<p>${message}</p>`;
}

// Tab Functionality
function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const tabLinks = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === tabName) {
            tab.classList.add('active');
        }
    });

    tabLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === tabName) {
            link.classList.add('active');
        }
    });

    // Clear search input when switching tabs
    document.getElementById('search').value = '';
}

// Global Search Functionality
document.getElementById('search').addEventListener('input', async (event) => {
    const searchTerm = event.target.value;

    // Fetch recommendations based on the search term
    await Promise.all([
        fetchMovieRecommendations(),
        fetchSongRecommendations(),
        fetchGameRecommendations()
    ]);
});

// Load Recommendations on Page Load
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        fetchMovieRecommendations(),
        fetchSongRecommendations(),
        fetchGameRecommendations()
    ]);
});
