const ANILIST_API = 'https://graphql.anilist.co';

let currentPage = 1;
let currentSort = 'TRENDING_DESC';
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let carouselIndex = 0;
let carouselInterval;

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSearch();
    loadHomepage();
    initWatchlist();
});

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            document.querySelectorAll('.nav-link').forEach(l => {
                l.classList.remove('active');
            });
            
            document.getElementById(targetId).classList.add('active');
            link.classList.add('active');
            
            if (targetId === 'home' && carouselIndex === 0) {
                loadHomepage();
            } else if (targetId === 'browse') {
                loadBrowseAnime();
            } else if (targetId === 'watchlist') {
                displayWatchlist();
            }
        });
    });
}

function initSearch() {
    const searchInput = document.getElementById('navSearch');
    const suggestions = document.getElementById('searchSuggestions');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            suggestions.classList.add('hidden');
            return;
        }

        searchTimeout = setTimeout(() => searchAnime(query), 500);
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => suggestions.classList.add('hidden'), 200);
    });
}

async function searchAnime(query) {
    try {
        const graphqlQuery = `
            query ($search: String) {
                Page(perPage: 5) {
                    media(search: $search, type: ANIME) {
                        id
                        title { romaji english }
                        coverImage { large }
                        averageScore
                        seasonYear
                    }
                }
            }
        `;

        const response = await fetch(ANILIST_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: graphqlQuery,
                variables: { search: query }
            })
        });

        const data = await response.json();
        displaySearchSuggestions(data.data.Page.media);
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchSuggestions(results) {
    const suggestions = document.getElementById('searchSuggestions');
    
    if (!results || results.length === 0) {
        suggestions.classList.add('hidden');
        return;
    }

    suggestions.innerHTML = results.map(anime => {
        const title = anime.title.english || anime.title.romaji;
        return `
            <div class="suggestion-item" onclick="showAnimeModal(${anime.id})">
                <img src="${anime.coverImage.large}" class="suggestion-img" alt="${title}">
                <div class="suggestion-info">
                    <h4>${title}</h4>
                    <p>${anime.seasonYear || 'N/A'} • ${anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A'}/10</p>
                </div>
            </div>
        `;
    }).join('');
    
    suggestions.classList.remove('hidden');
}

async function loadHomepage() {
    showLoader(true);
    
    try {
        await Promise.all([
            loadCarousel(),
            loadSection('trendingGrid', 'TRENDING_DESC', 6),
            loadSection('popularGrid', 'POPULARITY_DESC', 6),
            loadSection('recentGrid', 'START_DATE_DESC', 6),
            loadSection('topRatedGrid', 'SCORE_DESC', 6)
        ]);
    } catch (error) {
        console.error('Homepage error:', error);
    } finally {
        showLoader(false);
    }
}

async function loadCarousel() {
    const query = `
        query {
            Page(perPage: 5) {
                media(type: ANIME, sort: TRENDING_DESC) {
                    id
                    title { romaji english }
                    description
                    bannerImage
                    coverImage { extraLarge }
                    averageScore
                    episodes
                    seasonYear
                    genres
                }
            }
        }
    `;

    const response = await fetch(ANILIST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });

    const data = await response.json();
    const animeList = data.data.Page.media;
    
    const carousel = document.getElementById('heroCarousel');
    const indicators = document.getElementById('carouselIndicators');
    
    carousel.innerHTML = animeList.map(anime => {
        const title = anime.title.english || anime.title.romaji;
        const desc = anime.description ? anime.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '';
        const bg = anime.bannerImage || anime.coverImage.extraLarge;
        
        return `
            <div class="carousel-slide" style="background-image: url('${bg}')">
                <div class="carousel-content">
                    <h1 class="carousel-title">${title}</h1>
                    <div class="carousel-meta">
                        ${anime.averageScore ? `<span class="meta-badge"><i class="fas fa-star"></i> ${(anime.averageScore / 10).toFixed(1)}/10</span>` : ''}
                        ${anime.episodes ? `<span class="meta-badge"><i class="fas fa-film"></i> ${anime.episodes} Episodes</span>` : ''}
                        ${anime.seasonYear ? `<span class="meta-badge"><i class="fas fa-calendar"></i> ${anime.seasonYear}</span>` : ''}
                    </div>
                    <p class="carousel-description">${desc}</p>
                    <div class="carousel-actions">
                        <button class="btn-play" onclick="playAnimeTrailer(${anime.id}, '${title.replace(/'/g, "\\'")}')">
                            <i class="fas fa-play"></i> Watch Trailer
                        </button>
                        <button class="btn-info" onclick="showAnimeModal(${anime.id})">
                            <i class="fas fa-info-circle"></i> More Info
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    indicators.innerHTML = animeList.map((_, i) => 
        `<div class="indicator ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>`
    ).join('');
    
    startCarousel();
    
    document.getElementById('prevBtn').onclick = () => changeSlide(-1);
    document.getElementById('nextBtn').onclick = () => changeSlide(1);
}

function startCarousel() {
    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => changeSlide(1), 5000);
}

function changeSlide(direction) {
    const carousel = document.getElementById('heroCarousel');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    
    carouselIndex = (carouselIndex + direction + slides.length) % slides.length;
    carousel.style.transform = `translateX(-${carouselIndex * 100}%)`;
    
    indicators.forEach((ind, i) => {
        ind.classList.toggle('active', i === carouselIndex);
    });
    
    startCarousel();
}

function goToSlide(index) {
    const carousel = document.getElementById('heroCarousel');
    const indicators = document.querySelectorAll('.indicator');
    
    carouselIndex = index;
    carousel.style.transform = `translateX(-${carouselIndex * 100}%)`;
    
    indicators.forEach((ind, i) => {
        ind.classList.toggle('active', i === carouselIndex);
    });
    
    startCarousel();
}

async function loadSection(gridId, sort, perPage = 6) {
    const query = `
        query ($sort: [MediaSort], $perPage: Int) {
            Page(perPage: $perPage) {
                media(type: ANIME, sort: $sort) {
                    id
                    title { romaji english }
                    coverImage { large }
                    averageScore
                    episodes
                    format
                }
            }
        }
    `;

    const response = await fetch(ANILIST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query,
            variables: { sort: [sort], perPage }
        })
    });

    const data = await response.json();
    displayAnimeGrid(gridId, data.data.Page.media);
}

function displayAnimeGrid(gridId, animeList) {
    const grid = document.getElementById(gridId);
    if (!grid || !animeList) return;
    
    grid.innerHTML = animeList.map(anime => {
        const title = anime.title.english || anime.title.romaji;
        const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
        
        return `
            <div class="anime-card" onclick="showAnimeModal(${anime.id})">
                <img src="${anime.coverImage.large}" alt="${title}" class="anime-poster">
                ${score ? `<div class="anime-badge">★ ${score}</div>` : ''}
                <div class="anime-overlay">
                    <div class="anime-title">${title}</div>
                    <div class="anime-info">
                        ${anime.format || 'ANIME'} ${anime.episodes ? `• ${anime.episodes} eps` : ''}
                    </div>
                    <div class="anime-quick-actions">
                        <button class="quick-btn" onclick="event.stopPropagation(); toggleWatchlist(${anime.id})">
                            <i class="fas fa-bookmark"></i>
                        </button>
                        <button class="quick-btn" onclick="event.stopPropagation(); showAnimeModal(${anime.id})">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadBrowseAnime() {
    showLoader(true);
    
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (!sortFilter.hasAttribute('data-initialized')) {
        sortFilter.addEventListener('change', loadBrowseAnime);
        genreFilter.addEventListener('change', () => { currentPage = 1; loadBrowseAnime(); });
        yearFilter.addEventListener('change', () => { currentPage = 1; loadBrowseAnime(); });
        sortFilter.setAttribute('data-initialized', 'true');
    }
    
    currentSort = sortFilter.value;
    const genre = genreFilter.value;
    const year = yearFilter.value;
    
    try {
        const query = `
            query ($page: Int, $sort: [MediaSort], $genre: String, $year: Int) {
                Page(page: $page, perPage: 18) {
                    media(type: ANIME, sort: $sort, genre: $genre, seasonYear: $year) {
                        id
                        title { romaji english }
                        coverImage { large }
                        averageScore
                        episodes
                        format
                    }
                }
            }
        `;

        const response = await fetch(ANILIST_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                variables: {
                    page: currentPage,
                    sort: [currentSort],
                    genre: genre || null,
                    year: year ? parseInt(year) : null
                }
            })
        });

        const data = await response.json();
        displayAnimeGrid('browseGrid', data.data.Page.media);
        
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        loadMoreBtn.onclick = () => {
            currentPage++;
            loadBrowseAnime();
        };
    } catch (error) {
        console.error('Browse error:', error);
    } finally {
        showLoader(false);
    }
}

async function showAnimeModal(animeId) {
    showLoader(true);
    
    try {
        const query = `
            query ($id: Int) {
                Media(id: $id, type: ANIME) {
                    id
                    title { romaji english native }
                    description
                    bannerImage
                    coverImage { extraLarge }
                    averageScore
                    episodes
                    duration
                    status
                    genres
                    seasonYear
                    format
                    studios { nodes { name } }
                    trailer { id site }
                    characters(perPage: 8, sort: ROLE) {
                        edges {
                            node {
                                name { full }
                                image { large }
                            }
                        }
                    }
                    streamingEpisodes {
                        title
                        thumbnail
                        url
                    }
                }
            }
        `;

        const response = await fetch(ANILIST_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                variables: { id: animeId }
            })
        });

        const data = await response.json();
        displayAnimeModal(data.data.Media);
    } catch (error) {
        console.error('Modal error:', error);
    } finally {
        showLoader(false);
    }
}

function displayAnimeModal(anime) {
    const title = anime.title.english || anime.title.romaji;
    const desc = anime.description ? anime.description.replace(/<[^>]*>/g, '') : 'No description available';
    const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A';
    
    const modal = document.getElementById('animeModal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `
        ${anime.bannerImage ? `<img src="${anime.bannerImage}" class="modal-banner" alt="${title}">` : ''}
        <div class="modal-header">
            <div class="modal-poster-info">
                <img src="${anime.coverImage.extraLarge}" class="modal-poster" alt="${title}">
                <div class="modal-details">
                    <h1>${title}</h1>
                    <div class="modal-meta">
                        ${anime.averageScore ? `<span><i class="fas fa-star"></i> ${score}/10</span>` : ''}
                        ${anime.episodes ? `<span><i class="fas fa-film"></i> ${anime.episodes} Episodes</span>` : ''}
                        ${anime.duration ? `<span><i class="fas fa-clock"></i> ${anime.duration} min</span>` : ''}
                        ${anime.seasonYear ? `<span><i class="fas fa-calendar"></i> ${anime.seasonYear}</span>` : ''}
                        ${anime.status ? `<span><i class="fas fa-signal"></i> ${anime.status}</span>` : ''}
                    </div>
                    <div class="modal-genres">
                        ${anime.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                    </div>
                    <div class="carousel-actions">
                        ${anime.trailer && anime.trailer.site === 'youtube' ? `
                            <button class="btn-play" onclick="playAnimeTrailer(${anime.id}, '${title.replace(/'/g, "\\'")}', '${anime.trailer.id}')">
                                <i class="fas fa-play"></i> Watch Trailer
                            </button>
                        ` : ''}
                        <button class="btn-info" onclick="toggleWatchlist(${anime.id})">
                            <i class="fas fa-bookmark"></i> ${isInWatchlist(anime.id) ? 'Remove from' : 'Add to'} Watchlist
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-description">${desc}</div>
        ${anime.streamingEpisodes && anime.streamingEpisodes.length > 0 ? `
            <div class="modal-section">
                <h3>Episodes</h3>
                <div class="episodes-grid">
                    ${anime.streamingEpisodes.slice(0, 12).map((ep, i) => `
                        <div class="episode-card" onclick="playEpisode(${anime.id}, ${i + 1}, '${title.replace(/'/g, "\\'")}', '${ep.url}', '${ep.thumbnail}')">
                            <img src="${ep.thumbnail}" class="episode-thumb" alt="${ep.title}">
                            <div class="episode-info">
                                <div class="episode-title">${ep.title || `Episode ${i + 1}`}</div>
                                <div class="episode-number">Episode ${i + 1}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        ${anime.characters && anime.characters.edges.length > 0 ? `
            <div class="modal-section">
                <h3>Characters</h3>
                <div class="characters-grid">
                    ${anime.characters.edges.map(edge => `
                        <div class="character-card">
                            <img src="${edge.node.image.large}" class="character-img" alt="${edge.node.name.full}">
                            <div class="character-name">${edge.node.name.full}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('show');
    
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    closeBtn.onclick = () => {
        modal.classList.remove('show');
        modal.classList.add('hidden');
    };
    
    overlay.onclick = () => {
        modal.classList.remove('show');
        modal.classList.add('hidden');
    };
}

function toggleWatchlist(animeId) {
    const index = watchlist.indexOf(animeId);
    
    if (index > -1) {
        watchlist.splice(index, 1);
    } else {
        watchlist.push(animeId);
    }
    
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    
    if (document.getElementById('watchlist').classList.contains('active')) {
        displayWatchlist();
    }
}

function isInWatchlist(animeId) {
    return watchlist.includes(animeId);
}

function initWatchlist() {
    displayWatchlist();
}

async function displayWatchlist() {
    const grid = document.getElementById('watchlistGrid');
    const empty = document.getElementById('emptyWatchlist');
    
    if (watchlist.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    
    empty.style.display = 'none';
    showLoader(true);
    
    try {
        const query = `
            query ($ids: [Int]) {
                Page {
                    media(id_in: $ids, type: ANIME) {
                        id
                        title { romaji english }
                        coverImage { large }
                        averageScore
                        episodes
                        format
                    }
                }
            }
        `;

        const response = await fetch(ANILIST_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                variables: { ids: watchlist }
            })
        });

        const data = await response.json();
        displayAnimeGrid('watchlistGrid', data.data.Page.media);
    } catch (error) {
        console.error('Watchlist error:', error);
    } finally {
        showLoader(false);
    }
}

function showLoader(show) {
    const loader = document.getElementById('loader');
    loader.classList.toggle('hidden', !show);
}

function playAnimeTrailer(animeId, title, trailerId) {
    if (!trailerId) {
        alert('No trailer available for this anime');
        return;
    }

    const player = document.getElementById('videoPlayer');
    const content = document.getElementById('playerContent');
    
    content.innerHTML = `
        <iframe 
            src="https://www.youtube.com/embed/${trailerId}?autoplay=1&rel=0" 
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen>
        </iframe>
        <div class="player-info">
            <div class="player-title">${title}</div>
            <div class="player-episode">Official Trailer</div>
        </div>
    `;
    
    player.classList.remove('hidden');
    player.classList.add('show');
    
    const closeBtn = player.querySelector('.player-close');
    const overlay = player.querySelector('.player-overlay');
    
    const closePlayer = () => {
        player.classList.remove('show');
        player.classList.add('hidden');
        content.innerHTML = '';
    };
    
    closeBtn.onclick = closePlayer;
    overlay.onclick = closePlayer;
}

function playEpisode(animeId, episodeNum, title, url, thumbnail) {
    const player = document.getElementById('videoPlayer');
    const content = document.getElementById('playerContent');
    
    if (url && url.includes('http')) {
        content.innerHTML = `
            <iframe 
                src="${url}" 
                allow="autoplay; fullscreen; picture-in-picture"
                allowfullscreen>
            </iframe>
            <div class="player-info">
                <div class="player-title">${title}</div>
                <div class="player-episode">Episode ${episodeNum}</div>
            </div>
        `;
    } else {
        content.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; gap: 1.5rem; padding: 2rem;">
                <i class="fas fa-play-circle" style="font-size: 5rem; color: var(--primary);"></i>
                <h2 style="font-size: 1.5rem;">Streaming Coming Soon</h2>
                <p style="color: var(--text-secondary); text-align: center;">Direct streaming will be available soon. For now, please visit official streaming platforms.</p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                    <a href="https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}" target="_blank" class="btn-play">
                        <i class="fas fa-external-link-alt"></i> Crunchyroll
                    </a>
                    <a href="https://www.funimation.com/search/?q=${encodeURIComponent(title)}" target="_blank" class="btn-info">
                        <i class="fas fa-external-link-alt"></i> Funimation
                    </a>
                </div>
            </div>
        `;
    }
    
    player.classList.remove('hidden');
    player.classList.add('show');
    
    const closeBtn = player.querySelector('.player-close');
    const overlay = player.querySelector('.player-overlay');
    
    const closePlayer = () => {
        player.classList.remove('show');
        player.classList.add('hidden');
        content.innerHTML = '';
    };
    
    closeBtn.onclick = closePlayer;
    overlay.onclick = closePlayer;
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && player.classList.contains('show')) {
            closePlayer();
        }
    });
}
