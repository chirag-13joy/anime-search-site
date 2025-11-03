const API_BASE = 'https://api.trace.moe';
const JIKAN_API = 'https://api.jikan.moe/v4';

let uploadedFile = null;

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initImageUpload();
    initAnimeSearch();
});

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            document.querySelectorAll('.nav-links a').forEach(l => {
                l.classList.remove('active');
            });
            
            document.getElementById(targetId).classList.add('active');
            link.classList.add('active');
        });
    });
}

function initImageUpload() {
    const uploadBox = document.getElementById('uploadBox');
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const urlSearchBtn = document.getElementById('urlSearchBtn');
    const imageUrl = document.getElementById('imageUrl');

    uploadBox.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadedFile = file;
            displayImagePreview(file);
        }
    });

    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.classList.add('drag-over');
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.classList.remove('drag-over');
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            uploadedFile = file;
            displayImagePreview(file);
        }
    });

    searchBtn.addEventListener('click', () => {
        if (uploadedFile) {
            searchAnimeByImage(uploadedFile);
        }
    });

    clearBtn.addEventListener('click', () => {
        uploadedFile = null;
        imagePreview.classList.add('hidden');
        searchBtn.classList.add('hidden');
        fileInput.value = '';
        imageUrl.value = '';
        document.getElementById('results').classList.add('hidden');
    });

    urlSearchBtn.addEventListener('click', () => {
        const url = imageUrl.value.trim();
        if (url) {
            searchAnimeByUrl(url);
        }
    });
}

function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('imagePreview').classList.remove('hidden');
        document.getElementById('searchBtn').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

async function searchAnimeByImage(file) {
    showLoader(true);
    document.getElementById('results').classList.add('hidden');

    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE}/search`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Search failed');
        }

        const data = await response.json();
        displayResults(data.result);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to search anime. Please try again.');
    } finally {
        showLoader(false);
    }
}

async function searchAnimeByUrl(url) {
    showLoader(true);
    document.getElementById('results').classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE}/search?url=${encodeURIComponent(url)}`);

        if (!response.ok) {
            throw new Error('Search failed');
        }

        const data = await response.json();
        displayResults(data.result);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to search anime. Please try again.');
    } finally {
        showLoader(false);
    }
}

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    const resultsList = document.getElementById('resultsList');
    
    if (!results || results.length === 0) {
        resultsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No results found</p>';
        resultsDiv.classList.remove('hidden');
        return;
    }

    resultsList.innerHTML = results.slice(0, 5).map(result => {
        const similarity = (result.similarity * 100).toFixed(2);
        const minutes = Math.floor(result.from / 60);
        const seconds = Math.floor(result.from % 60);
        const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const title = result.filename || result.anilist?.title?.romaji || 'Unknown';
        const episode = result.episode || 'Unknown';

        return `
            <div class="result-card">
                <div class="result-header">
                    <div class="result-preview">
                        ${result.video ? `
                            <video autoplay loop muted>
                                <source src="${result.video}" type="video/mp4">
                            </video>
                        ` : `
                            <img src="${result.image}" alt="${title}">
                        `}
                    </div>
                    <div class="result-info">
                        <h4>${title}</h4>
                        <span class="similarity">${similarity}% Match</span>
                        <div class="result-meta">
                            <div class="meta-item">
                                <i class="fas fa-tv"></i>
                                <span>Episode ${episode}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-clock"></i>
                                <span>${timestamp}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    resultsDiv.classList.remove('hidden');
}

function showLoader(show) {
    const loader = document.getElementById('loader');
    if (show) {
        loader.classList.remove('hidden');
    } else {
        loader.classList.add('hidden');
    }
}

function initAnimeSearch() {
    const searchBtn = document.getElementById('animeSearchBtn');
    const searchInput = document.getElementById('animeSearchInput');

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchAnimeForDownload(query);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                searchAnimeForDownload(query);
            }
        }
    });
}

async function searchAnimeForDownload(query) {
    showLoader(true);
    
    try {
        const response = await fetch(`${JIKAN_API}/anime?q=${encodeURIComponent(query)}&limit=12`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch anime');
        }

        const data = await response.json();
        displayAnimeResults(data.data);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to search anime. Please try again.');
    } finally {
        showLoader(false);
    }
}

function displayAnimeResults(animeList) {
    const animeResults = document.getElementById('animeResults');
    
    if (!animeList || animeList.length === 0) {
        animeResults.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">No anime found</p>';
        return;
    }

    animeResults.innerHTML = animeList.map((anime, index) => `
        <div class="anime-card">
            <img src="${anime.images.jpg.large_image_url}" alt="${anime.title}" class="anime-image">
            <div class="anime-info">
                <h3 class="anime-title">${anime.title}</h3>
                <div class="anime-meta">
                    <div><i class="fas fa-star" style="color: #fbbf24;"></i> ${anime.score || 'N/A'}</div>
                    <div><i class="fas fa-calendar"></i> ${anime.year || 'N/A'}</div>
                    <div><i class="fas fa-film"></i> ${anime.episodes || '?'} episodes</div>
                </div>
                <p class="anime-synopsis">${anime.synopsis || 'No description available'}</p>
                <div class="download-options">
                    <button class="btn-download" onclick="downloadFullSeries('${anime.title}', ${anime.mal_id})">
                        <i class="fas fa-download"></i> Download Full Series
                    </button>
                    <button class="btn-download secondary" onclick="toggleEpisodes(${index}, ${anime.mal_id}, ${anime.episodes || 12})">
                        <i class="fas fa-list"></i> View Episodes
                    </button>
                    <div id="episodes-${index}" class="episodes-list"></div>
                </div>
            </div>
        </div>
    `).join('');
}

async function toggleEpisodes(index, animeId, totalEpisodes) {
    const episodesList = document.getElementById(`episodes-${index}`);
    
    if (episodesList.classList.contains('show')) {
        episodesList.classList.remove('show');
        return;
    }

    const episodes = [];
    const episodeCount = Math.min(totalEpisodes, 50);
    
    for (let i = 1; i <= episodeCount; i++) {
        episodes.push(`
            <div class="episode-item">
                <span>Episode ${i}</span>
                <button class="btn-download" style="padding: 0.4rem 1rem; font-size: 0.9rem;" onclick="downloadEpisode('${animeId}', ${i})">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `);
    }

    episodesList.innerHTML = episodes.join('');
    episodesList.classList.add('show');
}

function downloadFullSeries(title, animeId) {
    const searchQuery = encodeURIComponent(title);
    const sources = [
        `https://gogoanime.hu/?s=${searchQuery}`,
        `https://9anime.to/search?keyword=${searchQuery}`,
        `https://animixplay.to/?q=${searchQuery}`,
        `https://zoro.to/search?keyword=${searchQuery}`
    ];

    const message = `To download "${title}", you can visit these anime streaming sites:\n\n` +
        sources.map((url, i) => `${i + 1}. ${url}`).join('\n') +
        '\n\nNote: Please use legal streaming services and respect copyright laws.';

    alert(message);
    
    window.open(sources[0], '_blank');
}

function downloadEpisode(animeId, episodeNum) {
    const sources = [
        `https://gogoanime.hu/`,
        `https://9anime.to/`,
        `https://animixplay.to/`,
        `https://zoro.to/`
    ];

    const message = `To download Episode ${episodeNum}, please visit one of these sites and search for the anime:\n\n` +
        sources.map((url, i) => `${i + 1}. ${url}`).join('\n') +
        '\n\nNote: Please use legal streaming services and respect copyright laws.';

    alert(message);
    
    window.open(sources[0], '_blank');
}
