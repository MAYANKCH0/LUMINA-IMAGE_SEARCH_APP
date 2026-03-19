// Get API key from Vercel environment variable
// Fallback to placeholder for local testing
const accessKey = window.UNSPLASH_API_KEY || "YOUR_API_KEY";

const form = document.getElementById("search-form");
const searchBox = document.getElementById("search-box");
const imagesDiv = document.getElementById("images");
const loadMoreBtn = document.getElementById("load-more");
const suggestionsList = document.getElementById("suggestions");

// Modal Elements
const modalOverlay = document.getElementById("image-modal");
const modalImage = document.getElementById("modal-image");
const modalCloseBtn = document.getElementById("modal-close");

let page = 1;
let currentSearchKeyword = "";
let debounceTimer;

// Initially hide the load more button
loadMoreBtn.style.display = "none";

// Function to handle fetching and downloading images as a file
async function downloadImage(e, url, filename) {
    e.preventDefault();
    e.stopPropagation();

    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || "lumina-image.jpg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("Failed to download image:", error);
        alert("Sorry, an error occurred while downloading the image.");
    }
}

// Function to show default suggestions
function showDefaultSuggestions() {
    const defaultSuggestions = ["Aesthetics", "Nature", "Technology", "Architecture", "Minimalism"];
    renderSuggestions(defaultSuggestions);
}

// Function to render suggestions
function renderSuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) {
        suggestionsList.classList.remove("active");
        return;
    }

    suggestionsList.innerHTML = suggestions.map(tag =>
        `<li class="suggestion-item"><i class="ph ph-magnifying-glass"></i> ${tag}</li>`
    ).join("");

    document.querySelectorAll(".suggestion-item").forEach(item => {
        item.addEventListener("click", () => {
            searchBox.value = item.textContent.trim();
            suggestionsList.classList.remove("active");
            page = 1;
            searchImages();
        });
    });

    suggestionsList.classList.add("active");
}

// Fetch suggestions from Datamuse API
async function fetchSuggestions(query) {
    if (!query.trim()) {
        showDefaultSuggestions();
        return;
    }

    const url = `https://api.datamuse.com/sug?s=${query}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const suggestions = data.map(item => item.word).slice(0, 5);
        renderSuggestions(suggestions);
    } catch (error) {
        console.error("Failed to fetch suggestions", error);
    }
}

// Input & focus listeners for search box
searchBox.addEventListener("focus", () => {
    const value = searchBox.value.trim();
    if (!value) showDefaultSuggestions();
    else fetchSuggestions(value);
});

searchBox.addEventListener("input", (e) => {
    const value = e.target.value;
    if (!value.trim()) {
        showDefaultSuggestions();
        clearTimeout(debounceTimer);
    } else {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fetchSuggestions(value), 350);
    }
});

// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
    if (!form.contains(e.target)) suggestionsList.classList.remove("active");
});

// Modal Close Handlers
modalCloseBtn.addEventListener("click", () => {
    modalOverlay.classList.remove("active");
    setTimeout(() => { modalImage.src = ""; }, 300);
});

modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.remove("active");
        setTimeout(() => { modalImage.src = ""; }, 300);
    }
});

// Search Images Function
async function searchImages() {
    if (page === 1) currentSearchKeyword = searchBox.value;
    if (!currentSearchKeyword) return;

    const url = `https://api.unsplash.com/search/photos?page=${page}&query=${currentSearchKeyword}&per_page=12&client_id=${accessKey}`;

    suggestionsList.classList.remove("active");

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.errors) {
            imagesDiv.classList.remove('image-grid');
            imagesDiv.innerHTML = `<p class="message error-message">Error: ${data.errors[0]}.</p>`;
            loadMoreBtn.style.display = "none";
            return;
        }

        const results = data.results;

        if (page === 1) {
            imagesDiv.innerHTML = "";
            imagesDiv.classList.add('image-grid');
        }

        if (results && results.length > 0) {
            results.forEach(result => {
                const card = document.createElement("div");
                card.classList.add("image-card");

                const img = document.createElement("img");
                img.src = result.urls.regular;
                img.alt = result.alt_description || "Unsplash Image";

                card.addEventListener("click", () => {
                    modalImage.src = result.urls.regular;
                    modalOverlay.classList.add("active");
                });

                const overlay = document.createElement("div");
                overlay.classList.add("card-overlay");

                const downloadBtn = document.createElement("a");
                downloadBtn.href = "#";
                downloadBtn.classList.add("download-btn");
                downloadBtn.innerHTML = '<i class="ph ph-download-simple"></i>';
                downloadBtn.title = "Download image";

                const downloadUrl = result.urls.full;
                const filename = `lumina-${result.id}.jpg`;
                downloadBtn.addEventListener("click", (e) => downloadImage(e, downloadUrl, filename));

                overlay.appendChild(downloadBtn);
                card.appendChild(img);
                card.appendChild(overlay);
                imagesDiv.appendChild(card);
            });
            loadMoreBtn.style.display = "inline-flex";
        } else if (page === 1) {
            imagesDiv.classList.remove('image-grid');
            imagesDiv.innerHTML = "<p class='message'>No images found. Try a different search term.</p>";
            loadMoreBtn.style.display = "none";
        }

    } catch (error) {
        imagesDiv.classList.remove('image-grid');
        imagesDiv.innerHTML = `<p class='message error-message'>A network error occurred. Please try again later.</p>`;
        console.error(error);
        loadMoreBtn.style.display = "none";
    }
}

// Form and Load More button listeners
form.addEventListener("submit", (e) => {
    e.preventDefault();
    page = 1;
    searchImages();
});

loadMoreBtn.addEventListener("click", () => {
    page++;
    searchImages();
});

// Load default images on page load
window.addEventListener('DOMContentLoaded', () => {
    searchBox.value = "Cinematic";
    searchImages();
    searchBox.value = "";
});
