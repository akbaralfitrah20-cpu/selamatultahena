document.addEventListener("DOMContentLoaded", () => {
  const data = typeof KONTEN_IBU !== "undefined" ? KONTEN_IBU : null;

  if (!data) {
    console.error("Data halaman tidak ditemukan. Pastikan data.js dimuat sebelum script.js.");
    return;
  }

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  // Navigasi halaman
  let currentPage = 1;

  function showPage(pageNumber) {
    currentPage = Math.max(1, Math.min(5, pageNumber));

    $$(".book-page").forEach((page) => {
      page.classList.toggle("active", Number(page.dataset.page) === currentPage);
    });
    $$(".tab-btn").forEach((tab) => {
      tab.classList.toggle("active", Number(tab.dataset.target) === currentPage);
    });
    $$(".dot").forEach((dot) => {
      dot.classList.toggle("active", Number(dot.dataset.target) === currentPage);
    });

    $("#pageIndicatorText").textContent = `Halaman ${currentPage} / 5`;
    $("#prevPageBtn").disabled = currentPage === 1;
    $("#nextPageBtn").disabled = currentPage === 5;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $$(".tab-btn, .dot").forEach((control) => {
    control.addEventListener("click", () => showPage(Number(control.dataset.target)));
  });
  $("#prevPageBtn").addEventListener("click", () => showPage(currentPage - 1));
  $("#nextPageBtn").addEventListener("click", () => showPage(currentPage + 1));

  // Konten sampul
  $("#heroTitle").textContent = data.sampul.judul;
  $("#heroSubtitle").textContent = data.sampul.subjudul;

  // Musik latar
  const music = $("#birthdayMusic");
  const musicToggle = $("#musicToggle");

  musicToggle.addEventListener("click", async () => {
    if (music.paused) {
      try {
        await music.play();
      } catch (error) {
        $("#musicText").textContent = "Musik gagal diputar";
        console.error(error);
        return;
      }
    } else {
      music.pause();
    }
  });

  music.addEventListener("play", () => {
    $("#musicIcon").textContent = "⏸";
    $("#musicText").textContent = "Jeda Musik";
  });
  music.addEventListener("pause", () => {
    $("#musicIcon").textContent = "🎵";
    $("#musicText").textContent = "Putar Musik";
  });
  music.addEventListener("error", () => {
    $("#musicText").textContent = "Musik tidak ditemukan";
  });

  // Browser modern mengharuskan interaksi pertama pengguna.
  // Jika diizinkan, musik diputar otomatis saat halaman dibuka.
  music.play().catch(() => {
    const startMusicAfterInteraction = () => {
      if (music.paused) music.play().catch(() => {});
      document.removeEventListener("pointerdown", startMusicAfterInteraction);
      document.removeEventListener("keydown", startMusicAfterInteraction);
    };

    document.addEventListener("pointerdown", startMusicAfterInteraction, { once: true });
    document.addEventListener("keydown", startMusicAfterInteraction, { once: true });
  });

  // Tiup lilin
  $("#blowCandleBtn").addEventListener("click", () => {
    $("#candleFlame").classList.add("out");
    $("#candleSmoke").classList.add("rise");
    $("#wishStatus").textContent = "Permohonan Ena sudah diterbangkan ke langit. Semoga semua terkabul!";
    $("#blowCandleBtn").classList.add("hidden");
    $("#relightCandleBtn").classList.remove("hidden");
    createFloatingEffects("heart");
  });

  $("#relightCandleBtn").addEventListener("click", () => {
    $("#candleFlame").classList.remove("out");
    $("#candleSmoke").classList.remove("rise");
    $("#wishStatus").textContent = "Pejamkan mata sebentar, buat permohonan terbaik Ena, lalu tekan tombol di bawah ya!";
    $("#relightCandleBtn").classList.add("hidden");
    $("#blowCandleBtn").classList.remove("hidden");
  });

  // Surat
  $("#letterDate").textContent = data.surat.tanggal;
  $("#letterGreeting").textContent = data.surat.sapaan;
  $("#letterSign").innerHTML = data.surat.penutup;
  $("#letterBody").innerHTML = data.surat.paragraf
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");

  $("#openEnvelopeBtn").addEventListener("click", () => {
    $("#envelopeContainer").classList.add("hidden");
    $("#letterPaper").classList.remove("hidden");
  });

  $("#closeEnvelopeBtn").addEventListener("click", () => {
    $("#letterPaper").classList.add("hidden");
    $("#envelopeContainer").classList.remove("hidden");
  });

  // Galeri foto
  const grid = $("#polaroidGrid");

  function renderGallery(filter = "semua") {
    const items = filter === "semua"
      ? data.galeri
      : data.galeri.filter((item) => item.kategori === filter);

    grid.innerHTML = items.map((item, index) => `
      <article class="polaroid-card" data-gallery-index="${data.galeri.indexOf(item)}" tabindex="0" role="button">
        <img src="${item.foto}" alt="${item.judul}" loading="lazy">
        <h3>${item.judul}</h3>
        <span>${item.labelKategori}</span>
      </article>
    `).join("");

    $$(".polaroid-card").forEach((card) => {
      const open = () => openPhoto(Number(card.dataset.galleryIndex));
      card.addEventListener("click", open);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") open();
      });
    });
  }

  function openPhoto(index) {
    const item = data.galeri[index];
    $("#modalImg").src = item.foto;
    $("#modalImg").alt = item.judul;
    $("#modalCategory").textContent = item.labelKategori;
    $("#modalTitle").textContent = item.judul;
    $("#modalStory").textContent = item.cerita;
    $("#photoModal").classList.remove("hidden");
  }

  $$(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".filter-btn").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderGallery(button.dataset.filter);
    });
  });

  $("#closeModalBtn").addEventListener("click", () => $("#photoModal").classList.add("hidden"));
  $("#photoModal").addEventListener("click", (event) => {
    if (event.target === $("#photoModal")) $("#photoModal").classList.add("hidden");
  });
  renderGallery();

  // Kuis
  let quizIndex = 0;
  const quizQuestion = $("#quizQuestion");
  const quizOptions = $("#quizOptions");
  const quizFeedback = $("#quizFeedback");
  const nextQuiz = $("#nextQuizBtn");

  function renderQuiz() {
    const quiz = data.kuis[quizIndex];
    quizQuestion.textContent = quiz.pertanyaan;
    quizFeedback.textContent = "";
    nextQuiz.classList.add("hidden");
    quizOptions.innerHTML = "";

    quiz.pilihan.forEach((choice) => {
      const button = document.createElement("button");
      button.className = "quiz-option-btn";
      button.textContent = choice;
      button.addEventListener("click", () => {
        $$(".quiz-option-btn").forEach((option) => {
          option.disabled = true;
          option.classList.remove("selected");
        });
        button.classList.add("selected");
        quizFeedback.textContent = quiz.respon;
        nextQuiz.classList.remove("hidden");
      });
      quizOptions.appendChild(button);
    });
  }

  nextQuiz.addEventListener("click", () => {
    quizIndex = (quizIndex + 1) % data.kuis.length;
    renderQuiz();
  });
  renderQuiz();

  // Kupon gosok
  let couponIndex = 0;
  const canvas = $("#scratchCanvas");
  const context = canvas.getContext("2d");

  function updateCoupon() {
    const coupon = data.kuponHadiah[couponIndex];
    $("#couponTitle").textContent = coupon.judul;
    $("#couponDesc").textContent = coupon.deskripsi;

    context.globalCompositeOperation = "source-over";
    context.fillStyle = "#d98296";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fff";
    context.font = "700 18px Nunito, sans-serif";
    context.textAlign = "center";
    context.fillText("GOSOK SINI", canvas.width / 2, canvas.height / 2);

    const message = `Halo! Aku mau klaim hadiah: ${coupon.judul}`;
    $("#claimWaBtn").href =
      `https://wa.me/${data.nomorWhatsApp}?text=${encodeURIComponent(message)}`;
  }

  let scratching = false;

  function scratch(event) {
    if (!scratching) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(x, y, 18, 0, Math.PI * 2);
    context.fill();
  }

  canvas.addEventListener("pointerdown", (event) => {
    scratching = true;
    canvas.setPointerCapture(event.pointerId);
    scratch(event);
  });
  canvas.addEventListener("pointermove", scratch);
  canvas.addEventListener("pointerup", () => { scratching = false; });
  canvas.addEventListener("pointercancel", () => { scratching = false; });

  $("#newCouponBtn").addEventListener("click", () => {
    couponIndex = (couponIndex + 1) % data.kuponHadiah.length;
    updateCoupon();
  });
  updateCoupon();

  // Doa dan peluk
  $("#prayerBox").innerHTML = data.doaPenutup
    .map((prayer) => `<p>${prayer}</p>`)
    .join("");

  let hugCount = Number(localStorage.getItem("ibu-hug-count") || 0);
  $("#hugCount").textContent = hugCount;

  $("#sendHugBtn").addEventListener("click", () => {
    hugCount += 1;
    localStorage.setItem("ibu-hug-count", String(hugCount));
    $("#hugCount").textContent = hugCount;
    createFloatingEffects("hug");
  });

  function createFloatingEffects(type) {
    const layer = $("#floatingEffects");
    for (let i = 0; i < 18; i += 1) {
      const item = document.createElement("span");
      item.className = "floating-effect";
      item.textContent = type === "hug" ? "🤗" : "❤";
      item.style.left = `${Math.random() * 100}%`;
      item.style.animationDuration = `${2.5 + Math.random() * 2}s`;
      item.style.fontSize = `${14 + Math.random() * 18}px`;
      layer.appendChild(item);
      setTimeout(() => item.remove(), 5000);
    }
  }

  showPage(1);
});
