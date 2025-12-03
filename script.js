document.addEventListener("DOMContentLoaded", () => {
  // --- Background Film Noise Canvas Effect ---
  const canvas = document.getElementById("backgroundCanvas");
  const ctx = canvas.getContext("2d");
  let noiseData;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateNoise();
  }

  function generateNoise() {
    noiseData = ctx.createImageData(canvas.width, canvas.height);
    const buffer = new Uint32Array(noiseData.data.buffer);

    for (let i = 0; i < buffer.length; i++) {
      const value = Math.floor(Math.random() * 255);
      const alpha = Math.floor(Math.random() * 20) + 5;
      buffer[i] = (alpha << 24) | (value << 16) | (value << 8) | value;
    }
  }

  function animateNoise() {
    ctx.putImageData(noiseData, 0, 0);
    generateNoise();
    requestAnimationFrame(animateNoise);
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  resizeCanvas();
  animateNoise();

  // --- Custom Cursor ---
  const cursor = document.createElement("div");
  cursor.classList.add("custom-cursor");
  document.body.appendChild(cursor);

  document.addEventListener("mousemove", (e) => {
    // Position cursor using center transform (CSS handles centering)
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
  });

  document
    .querySelectorAll("a, button, .top-song-item, .music-table-row")
    .forEach((element) => {
      element.addEventListener("mouseenter", () =>
        cursor.classList.add("hovered")
      );
      element.addEventListener("mouseleave", () =>
        cursor.classList.remove("hovered")
      );
    });

  // --- Smooth Scrolling for Navigation Links ---
  document
    .querySelectorAll(".footer-nav a, .hero-full-album-button")
    .forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("href").substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

  // --- Audio Player Functionality ---
  const audioSource = document.getElementById("audio-source");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const loopBtn = document.getElementById("loop-btn");
  const currentSongTitle = document.getElementById("current-song-title");
  const currentSongArtist = document.getElementById("current-song-artist");
  const progressContainer = document.getElementById("progress-container");
  const progressTrack = document.getElementById("progress-track");
  const progressFilled = document.getElementById("progress-filled");
  const progressThumb = document.getElementById("progress-thumb");
  const timeCurrentEl = document.getElementById("time-current");
  const timeTotalEl = document.getElementById("time-total");
  const topSongItems = document.querySelectorAll(".top-song-item");
  const volumeBtn = document.getElementById("volume-btn");
  const volumeSlider = document.getElementById("volume-slider");

  let playlist = [
    { title: "Sakchu ra", artist: "THASINN69", src: "src/Sakchu ra.mp3" },
    { title: "Navanerai", artist: "THASINN69", src: "src/Navanerai.mp3" },
    { title: "Pardaina", artist: "THASINN69", src: "src/pardaina.mp3" },
    { title: "Maya", artist: "THASINN69", src: "src/Maya.wav" },
    {
      title: "Mitho samjhana",
      artist: "THASINN69",
      src: "src/Mithosamjhana.mp3",
    },
    { title: "Dhilo", artist: "THASINN69", src: "src/Dhilo.mp3" },
  ];

  let currentSongIndex = 0;
  let isPlaying = false;
  let isShuffling = false;
  let isLooping = false;
  let shuffledPlaylist = [];
  // volume state
  let previousVolume = 1;

  // initialize volume from localStorage if available
  try {
    const savedVol = parseFloat(localStorage.getItem("thasinn_volume"));
    if (!isNaN(savedVol)) {
      audioSource.volume = Math.max(0, Math.min(1, savedVol));
    } else {
      audioSource.volume = 1;
    }
  } catch (e) {
    audioSource.volume = 1;
  }
  if (volumeSlider) volumeSlider.value = audioSource.volume;

  function updateVolumeIcon(vol) {
    if (!volumeBtn) return;
    const i = volumeBtn.querySelector("i");
    if (!i) return;
    if (vol === 0 || audioSource.muted) {
      i.className = "fas fa-volume-mute";
    } else if (vol > 0 && vol <= 0.5) {
      i.className = "fas fa-volume-down";
    } else {
      i.className = "fas fa-volume-up";
    }
  }

  // wire slider
  if (volumeSlider) {
    volumeSlider.addEventListener("input", function (e) {
      const v = parseFloat(this.value);
      audioSource.volume = v;
      audioSource.muted = false;
      try {
        localStorage.setItem("thasinn_volume", v);
      } catch (e) {}
      updateVolumeIcon(v);
      previousVolume = v;
    });
  }

  if (volumeBtn) {
    volumeBtn.addEventListener("click", function () {
      if (audioSource.muted || audioSource.volume === 0) {
        // unmute
        audioSource.muted = false;
        audioSource.volume = previousVolume || 0.8;
        if (volumeSlider) volumeSlider.value = audioSource.volume;
      } else {
        // mute
        previousVolume = audioSource.volume;
        audioSource.muted = true;
        if (volumeSlider) volumeSlider.value = 0;
      }
      updateVolumeIcon(audioSource.muted ? 0 : audioSource.volume);
      try {
        localStorage.setItem("thasinn_volume", audioSource.volume);
      } catch (e) {}
    });
  }

  function loadSong(songIndex) {
    currentSongIndex = songIndex;
    const song =
      isShuffling && shuffledPlaylist.length > 0
        ? shuffledPlaylist[currentSongIndex]
        : playlist[currentSongIndex];
    audioSource.src = song.src;
    currentSongTitle.textContent = song.title;
    currentSongArtist.textContent = song.artist;
    audioSource.load();
  }

  function playSong() {
    isPlaying = true;
    playPauseBtn.querySelector("i").classList.remove("fa-play");
    playPauseBtn.querySelector("i").classList.add("fa-pause");
    audioSource.play();
  }

  function pauseSong() {
    isPlaying = false;
    playPauseBtn.querySelector("i").classList.remove("fa-pause");
    playPauseBtn.querySelector("i").classList.add("fa-play");
    audioSource.pause();
  }

  function nextSong() {
    if (isShuffling) {
      currentSongIndex = (currentSongIndex + 1) % shuffledPlaylist.length;
    } else {
      currentSongIndex = (currentSongIndex + 1) % playlist.length;
    }
    loadSong(currentSongIndex);
    playSong();

    // Update active album
    updateActiveAlbum(currentSongIndex);
  }

  function prevSong() {
    if (isShuffling) {
      currentSongIndex =
        (currentSongIndex - 1 + shuffledPlaylist.length) %
        shuffledPlaylist.length;
    } else {
      currentSongIndex =
        (currentSongIndex - 1 + playlist.length) % playlist.length;
    }
    loadSong(currentSongIndex);
    playSong();

    // Update active album
    updateActiveAlbum(currentSongIndex);
  }

  function toggleShuffle() {
    isShuffling = !isShuffling;
    shuffleBtn.classList.toggle("active", isShuffling);
    if (isShuffling) {
      shuffledPlaylist = [...playlist].sort(() => Math.random() - 0.5);
      const currentPlayingSong = playlist[currentSongIndex];
      currentSongIndex = shuffledPlaylist.findIndex(
        (song) => song.title === currentPlayingSong.title
      );
    } else {
      const currentPlayingSong = shuffledPlaylist[currentSongIndex];
      currentSongIndex = playlist.findIndex(
        (song) => song.title === currentPlayingSong.title
      );
    }
    loadSong(currentSongIndex);
    if (isPlaying) playSong();

    // Update active album
    updateActiveAlbum(currentSongIndex);
  }

  function toggleLoop() {
    isLooping = !isLooping;
    audioSource.loop = isLooping;
    loopBtn.classList.toggle("active", isLooping);
  }

  function formatTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${min}:${sec}`;
  }

  function updateProgress(e) {
    const duration = audioSource.duration || 0;
    const currentTime = audioSource.currentTime || 0;
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    if (progressFilled) progressFilled.style.width = `${progressPercent}%`;
    if (progressThumb) progressThumb.style.left = `${progressPercent}%`;
    if (timeCurrentEl) timeCurrentEl.textContent = formatTime(currentTime);
    if (timeTotalEl && isFinite(duration) && !isNaN(duration))
      timeTotalEl.textContent = formatTime(duration);
  }

  function setProgressBar(e) {
    // calculate relative to the progressTrack element
    const rect = progressTrack.getBoundingClientRect();
    const clickX = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const duration = audioSource.duration || 0;
    if (duration > 0)
      audioSource.currentTime = (clickX / rect.width) * duration;
  }

  playPauseBtn.addEventListener("click", () =>
    isPlaying ? pauseSong() : playSong()
  );
  prevBtn.addEventListener("click", prevSong);
  nextBtn.addEventListener("click", nextSong);
  shuffleBtn.addEventListener("click", toggleShuffle);
  loopBtn.addEventListener("click", toggleLoop);
  audioSource.addEventListener("timeupdate", updateProgress);
  // update total time when metadata loads
  audioSource.addEventListener("loadedmetadata", () => {
    if (timeTotalEl && isFinite(audioSource.duration))
      timeTotalEl.textContent = formatTime(audioSource.duration);
    updateProgress();
  });
  if (progressTrack) progressTrack.addEventListener("click", setProgressBar);

  audioSource.addEventListener("ended", () => {
    if (!isLooping) {
      nextSong();
    } else {
      playSong();
    }
  });

  // --- Music Section Functionality ---
  const albumData = [
    {
      artist: "THASINN69",
      title: "Sakchu ra",
      genreLabel: "Pop / Independent",
      year: "2024",
      cover: "src/Sakchu ra.jpg",
    },
    {
      artist: "THASINN69",
      title: "Navanerai",
      genreLabel: "R&B / Independent",
      year: "2023",
      cover: "https://placehold.co/120x80/2a2a2a/FFF?text=ALBUM+2",
    },
    {
      artist: "THASINN69",
      title: "Pardaina",
      genreLabel: "Soul / Independent",
      year: "2022",
      cover: "src/pardina.wav",
    },
    {
      artist: "THASINN69",
      title: "Maya",
      genreLabel: "Acoustic / Independent",
      year: "2021",
      cover: "https://placehold.co/120x80/4a4a4a/FFF?text=ALBUM+4",
    },
    {
      artist: "THASINN69",
      title: "Mitho samjhana",
      genreLabel: "Folk / Independent",
      year: "2020",
      cover: "https://placehold.co/120x80/5a5a5a/FFF?text=ALBUM+5",
    },
    {
      artist: "THASINN69",
      title: "Dhilo",
      genreLabel: "Ballad / Independent",
      year: "2019",
      cover: "https://placehold.co/120x80/6a6a6a/FFF?text=ALBUM+6",
    },
  ];

  const musicTableBody = document.querySelector(".music-table-body");

  // Dynamically generate table rows
  function generateMusicTable() {
    musicTableBody.innerHTML = ""; // Clear existing rows
    albumData.forEach((album, index) => {
      const row = document.createElement("tr");
      row.classList.add("music-table-row");
      row.dataset.index = index;

      // Render row with full info and clickable title that plays the album instantly
      const isActive = index === 0;
      row.classList.toggle("active-row", isActive);
      row.innerHTML = `
                <td class="music-table-td cover-col">
                    <img src="${album.cover}" alt="Album Cover ${
        index + 1
      }" class="album-cover-img small">
                </td>
                <td class="music-table-td title-col">
                    <a href="#" class="album-play-link" data-index="${index}">${
        album.title
      }</a>
                </td>
                <td class="music-table-td artist-col">${album.artist}</td>
                <td class="music-table-td genre-col">${album.genreLabel}</td>
                <td class="music-table-td year-col">${album.year}</td>
            `;

      musicTableBody.appendChild(row);
    });
  }

  // Update the active album
  function updateActiveAlbum(index) {
    // Re-render rows to reflect active state and keep clickable links
    const rows = document.querySelectorAll(".music-table-row");
    rows.forEach((row, rowIndex) => {
      const album = albumData[rowIndex];
      const isActive = rowIndex === index;
      row.classList.toggle("active-row", isActive);
      row.innerHTML = `
                <td class="music-table-td cover-col">
                    <img src="${album.cover}" alt="Album Cover ${
        rowIndex + 1
      }" class="album-cover-img small">
                </td>
                <td class="music-table-td title-col">
                    <a href="#" class="album-play-link" data-index="${rowIndex}">${
        album.title
      }</a>
                </td>
                <td class="music-table-td artist-col">${album.artist}</td>
                <td class="music-table-td genre-col">${album.genreLabel}</td>
                <td class="music-table-td year-col">${album.year}</td>
            `;
    });
  }

  // Initial table generation
  generateMusicTable();

  // Handle clicks on album title links to play instantly
  musicTableBody.addEventListener("click", (e) => {
    const link = e.target.closest(".album-play-link");
    if (link) {
      e.preventDefault();
      const index = parseInt(link.dataset.index);
      if (!isNaN(index)) {
        currentSongIndex = index;
        loadSong(index);
        playSong();
        updateActiveAlbum(index);
      }
      return;
    }

    // fallback: clicking row plays album
    const row = e.target.closest(".music-table-row");
    if (row) {
      const index = parseInt(row.dataset.index);
      if (!isNaN(index)) {
        currentSongIndex = index;
        loadSong(index);
        playSong();
        updateActiveAlbum(index);
      }
    }
  });

  // Sync with top songs section
  topSongItems.forEach((item) => {
    item.addEventListener("click", () => {
      const index = parseInt(item.dataset.index);
      loadSong(index);
      playSong();
      updateActiveAlbum(index % albumData.length); // Map to album data
    });
  });

  // Initial load
  loadSong(0);
});
