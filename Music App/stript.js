const audio = document.getElementById("audio");

const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");

const progress = document.getElementById("progress");
const volume = document.getElementById("volume");
const volumeBtn = document.getElementById("volumeBtn");

const currentTimeElement = document.getElementById("currentTime");
const durationElement = document.getElementById("duration");

const songTitle = document.getElementById("songTitle");
const songArtist = document.getElementById("songArtist");

const playlist = document.getElementById("playlist");

const disc = document.querySelector(".disc");
const albumCover = document.getElementById("albumCover");


const songs = [
    {
        title: "Choo Lo",
        artist: "The Local Train",
        src: "songs/choolo.mp3",
        cover: "images/choolo.jpg"
    },
    {
        title: "Nemesis",
        artist: "Fossils",
        src: "songs/Nemesis.mp3",
        cover: "images/Nemesis.jpg"
    },
    {
        title: "Purnota",
        artist: "Warfaze",
        src: "songs/Purnota.mp3",
        cover: "images/warfaze.jpg"
    }
];


let currentSong = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = false;

let favorites = JSON.parse(
    localStorage.getItem("luminaFavorites") || "[]"
);

function loadSong(index) {
    if (index < 0) {
        index = songs.length - 1;
    }

    if (index >= songs.length) {
        index = 0;
    }

    currentSong = index;

    const song = songs[currentSong];

    audio.src = song.src;

    songTitle.textContent = song.title;
    songArtist.textContent = song.artist;

    albumCover.src = song.cover;
    
    updatePlaylist();
}


function playSong() {
    audio.play()
        .then(() => {
            isPlaying = true;

            playBtn.innerHTML =
                '<i class="fa-solid fa-pause"></i>';

            disc.classList.add("playing");
        })
        .catch((error) => {
            console.warn("Audio could not be played:", error);
        });
}


function pauseSong() {
    audio.pause();

    isPlaying = false;

    playBtn.innerHTML =
        '<i class="fa-solid fa-play"></i>';

    disc.classList.remove("playing");
}


playBtn.addEventListener("click", () => {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});


prevBtn.addEventListener("click", () => {
    loadSong(currentSong - 1);
    playSong();
});


nextBtn.addEventListener("click", () => {
    nextSong();
});

function nextSong() {

    if (isShuffle) {
        let randomIndex;

        do {
            randomIndex =
                Math.floor(Math.random() * songs.length);
        } while (
            songs.length > 1 &&
            randomIndex === currentSong
        );

        loadSong(randomIndex);

    } else {
        loadSong(currentSong + 1);
    }

    playSong();
}



audio.addEventListener("timeupdate", () => {

    if (!audio.duration) {
        return;
    }

    const percentage =
        (audio.currentTime / audio.duration) * 100;

    progress.value = percentage;

    currentTimeElement.textContent =
        formatTime(audio.currentTime);
});


audio.addEventListener("loadedmetadata", () => {

    durationElement.textContent =
        formatTime(audio.duration);

});



progress.addEventListener("input", () => {

    if (!audio.duration) {
        return;
    }

    audio.currentTime =
        (progress.value / 100) * audio.duration;

});



audio.addEventListener("ended", () => {

    if (repeatMode) {
        audio.currentTime = 0;
        playSong();
        return;
    }

    nextSong();

});


shuffleBtn.addEventListener("click", () => {

    isShuffle = !isShuffle;

    shuffleBtn.classList.toggle(
        "active",
        isShuffle
    );

});


repeatBtn.addEventListener("click", () => {

    repeatMode = !repeatMode;

    repeatBtn.classList.toggle(
        "active",
        repeatMode
    );

});



volume.addEventListener("input", () => {

    audio.volume = volume.value;

    updateVolumeIcon();

});


volumeBtn.addEventListener("click", () => {

    audio.muted = !audio.muted;

    updateVolumeIcon();

});

function updateVolumeIcon() {

    const icon =
        volumeBtn.querySelector("i");

    if (
        audio.muted ||
        audio.volume === 0
    ) {
        icon.className =
            "fa-solid fa-volume-xmark";

    } else if (audio.volume < 0.5) {
        icon.className =
            "fa-solid fa-volume-low";

    } else {
        icon.className =
            "fa-solid fa-volume-high";
    }
}


function updatePlaylist() {

    playlist.innerHTML = "";

    songs.forEach((song, index) => {

        const item =
            document.createElement("div");

        item.className = "song-item";

        if (index === currentSong) {
            item.classList.add("active");
        }

        const isLoved =
            favorites.includes(index);

        item.innerHTML = `
            <div class="song-number">
                ${index + 1}
            </div>

            <div class="song-cover">
                <i class="fa-solid fa-music"></i>
            </div>

            <div class="song-details">
                <h3>${song.title}</h3>
                <p>${song.artist}</p>
            </div>

            <button
                class="favorite-btn ${isLoved ? "loved" : ""}"
                data-index="${index}"
            >
                <i class="fa-${isLoved ? "solid" : "regular"} fa-heart"></i>
            </button>
        `;

        item.addEventListener("click", (event) => {

            if (
                event.target.closest(".favorite-btn")
            ) {
                return;
            }

            loadSong(index);
            playSong();

        });

        const favoriteButton =
            item.querySelector(".favorite-btn");

        favoriteButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                toggleFavorite(index);
            }
        );

        playlist.appendChild(item);

    });
}


function toggleFavorite(index) {

    if (favorites.includes(index)) {

        favorites =
            favorites.filter(
                item => item !== index
            );

    } else {

        favorites.push(index);

    }

    localStorage.setItem(
        "luminaFavorites",
        JSON.stringify(favorites)
    );

    updatePlaylist();

}


const tabs =
    document.querySelectorAll(".tab");

tabs.forEach(tab => {

    tab.addEventListener("click", () => {

        tabs.forEach(item => {
            item.classList.remove("active");
        });

        tab.classList.add("active");

        const type =
            tab.dataset.tab;

        if (type === "loved") {
            showLovedSongs();
        } else {
            updatePlaylist();
        }

    });

});


function showLovedSongs() {

    playlist.innerHTML = "";

    const lovedSongs =
        songs.filter((song, index) =>
            favorites.includes(index)
        );

    if (lovedSongs.length === 0) {

        playlist.innerHTML = `
            <div
                style="
                    text-align:center;
                    padding:30px;
                    color:#92929d;
                "
            >
                No loved songs yet.
            </div>
        `;

        return;
    }

    lovedSongs.forEach(song => {

        const index =
            songs.indexOf(song);

        const item =
            document.createElement("div");

        item.className = "song-item";

        if (index === currentSong) {
            item.classList.add("active");
        }

        item.innerHTML = `
            <div class="song-number">
                ${index + 1}
            </div>

            <div class="song-cover">
                <i class="fa-solid fa-music"></i>
            </div>

            <div class="song-details">
                <h3>${song.title}</h3>
                <p>${song.artist}</p>
            </div>

            <button
                class="favorite-btn loved"
            >
                <i class="fa-solid fa-heart"></i>
            </button>
        `;

        item.addEventListener("click", (event) => {

            if (
                event.target.closest(".favorite-btn")
            ) {
                return;
            }

            loadSong(index);
            playSong();

        });

        const favoriteButton =
            item.querySelector(".favorite-btn");

        favoriteButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                toggleFavorite(index);

                showLovedSongs();

            }
        );

        playlist.appendChild(item);

    });

}


function formatTime(time) {

    if (!Number.isFinite(time)) {
        return "0:00";
    }

    const minutes =
        Math.floor(time / 60);

    const seconds =
        Math.floor(time % 60)
            .toString()
            .padStart(2, "0");

    return `${minutes}:${seconds}`;
}


audio.volume = 1;

loadSong(0);

updateVolumeIcon();