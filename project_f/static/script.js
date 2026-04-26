/* جزئيه الربوت متاع البحث ورد النتيجه*/
/* جزئيه الربوت المربوطة بالباك أند الحقيقي */
async function analyze() {
  const result = document.getElementById("result");
  const loadingRobot = document.getElementById("loadingRobot");
  const fileInput = document.getElementById("fileInput");
  const camContainer = document.getElementById("gradcamContainer");
  const camImg = document.getElementById("gradcamImage");
  const heatmapImg = document.getElementById("heatmapImage");
  const originalImg = document.getElementById("originalImage");

  // التحقق من وجود العناصر
  if (!fileInput || !result || !loadingRobot) return;

  // التحقق من اختيار ملف
  if (!fileInput.files.length) {
    result.style.display = "block";
    result.innerHTML = "⚠ Please upload an image first.";
    loadingRobot.style.display = "none";
    if (camContainer && camImg) {
      camContainer.style.display = "none";
      camImg.src = "";
      if (heatmapImg) heatmapImg.src = "";
      if (originalImg) originalImg.src = "";
    }
    return;
  }

  // تجهيز البيانات (الصورة) لإرسالها
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  // تصفير النتيجة وإظهار الروبوت
  result.innerHTML = "";
  result.style.display = "none";
  loadingRobot.style.display = "block";
  if (camContainer && camImg) {
    camContainer.style.display = "none";
    camImg.src = "";
    if (heatmapImg) heatmapImg.src = "";
    if (originalImg) originalImg.src = "";
  }

  try {
    // الاتصال بالباك أند (Flask)
   const response = await fetch('/predict', {
    method: 'POST',
    body: formData
});

    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }

    if (!response.ok) {
      const serverMsg = data?.error ? ` (${data.error})` : "";
      throw new Error(`HTTP ${response.status}${serverMsg}`);
    }

    // إخفاء الروبوت بعد انتهاء التحليل
    loadingRobot.style.display = "none";

    if (data.error) {
      result.style.display = "block";
      result.innerHTML = `<span style="color: #ff4d4d;">❌ Error: ${data.error}</span>`;
    } else {
      // 1. إظهار النتيجة النصية والنسبة (تعديل بسيط للنسبة)
      result.style.display = "block";
      const isReal = data.result.includes("Real");
      const color = isReal ? "#28a745" : "#dc3545";

      // تحويل الرقم لنسبة مئوية
      const confidencePercent = (parseFloat(data.confidence) * 100).toFixed(2) + "%";
      

      result.innerHTML = `
        <div style="text-align: center;">
          <h3 style="color: ${color}; margin-bottom: 5px; font-size: 1.5rem;">${data.result}</h3>
          <p style="font-size: 1.1rem; opacity: 0.9;">Confidence: <strong>${confidencePercent}</strong></p>
        
        </div>
      `;

      // 2. إظهار صورة الـ Grad-CAM (هذا هو الكود المضاف)
      if (data.gradcam_url && camContainer && camImg) {
        const t = "?t=" + new Date().getTime();
        camImg.src = data.gradcam_url + t;
        if (heatmapImg && data.heatmap_url) {
          heatmapImg.src = data.heatmap_url + t;
        }
        if (originalImg && data.original_url) {
          originalImg.src = data.original_url + t;
        }
    
        camContainer.style.display = "block";
      }

      if (typeof gsap !== 'undefined') {
        gsap.from(result, { y: 20, opacity: 0, duration: 0.5, ease: "power2.out" });
      }
    }
  } catch (error) {
    loadingRobot.style.display = "none";
    result.style.display = "block";
    result.innerHTML = `❌ Request failed: ${error.message}`;
    console.error("Fetch Error:", error);
  }
}

/* upload preview  جزئيه عرض الصوره ل تم اختيارها*/
const fileInput = document.getElementById("fileInput");
const uploadPreviewImage = document.getElementById("previewImage");

if (fileInput && uploadPreviewImage) {
  fileInput.addEventListener("change", function () {
    const file = this.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        uploadPreviewImage.src = e.target.result;
        uploadPreviewImage.style.display = "block";
      };

      reader.readAsDataURL(file);
    }
  });
}

/* glass theme toggle  تبديل الوضع اليلي*/
const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }
});

/* ABOUT  جزئية الكارد متاع الاباوت*/
const openAbout = document.getElementById("openAbout");
const aboutModal = document.getElementById("aboutModal");
const closeAbout = document.getElementById("closeAbout");
const closeAboutBtn = document.getElementById("closeAboutBtn");
const aboutCarousel = document.getElementById("aboutCarousel");
const aboutCards = document.querySelectorAll(".about-card");
const aboutPrev = document.getElementById("aboutPrev");
const aboutNext = document.getElementById("aboutNext");

let aboutAngle = 0;
let aboutRadius = 320;
let aboutDragging = false;
let startX = 0;
let currentAngle = 0;
let aboutInitialized = false;

function setupAboutCarousel() {
  if (aboutInitialized || !aboutCarousel || !aboutCards.length) return;

  const total = aboutCards.length;
  const step = 360 / total;

  aboutCards.forEach((card, i) => {
    const cardAngle = step * i;
    gsap.set(card, {
      rotateY: cardAngle,
      transformOrigin: `50% 50% ${-aboutRadius}px`,
      z: aboutRadius
    });
  });

  gsap.set(aboutCarousel, {
    rotateY: aboutAngle,
    transformStyle: "preserve-3d"
  });

  aboutInitialized = true;
}

if (openAbout && aboutModal) {
  openAbout.addEventListener("click", (e) => {
    e.preventDefault();
    aboutModal.classList.add("active");
    setupAboutCarousel();
  });
}

if (closeAbout && aboutModal) {
  closeAbout.addEventListener("click", () => {
    aboutModal.classList.remove("active");
  });
}

if (closeAboutBtn && aboutModal) {
  closeAboutBtn.addEventListener("click", () => {
    aboutModal.classList.remove("active");
  });
}

if (aboutCarousel) {
  aboutCarousel.addEventListener("mousedown", (e) => {
    aboutDragging = true;
    startX = e.clientX;
    currentAngle = aboutAngle;
    aboutCarousel.style.cursor = "grabbing";
  });

  aboutCarousel.addEventListener("touchstart", (e) => {
    aboutDragging = true;
    startX = e.touches[0].clientX;
    currentAngle = aboutAngle;
  }, { passive: true });
}

window.addEventListener("mousemove", (e) => {
  if (!aboutDragging || !aboutCarousel) return;
  const delta = e.clientX - startX;
  aboutAngle = currentAngle + delta * 0.45;
  gsap.set(aboutCarousel, { rotateY: aboutAngle });
});

window.addEventListener("mouseup", () => {
  aboutDragging = false;
  if (aboutCarousel) aboutCarousel.style.cursor = "grab";
});

window.addEventListener("touchmove", (e) => {
  if (!aboutDragging || !aboutCarousel) return;
  const delta = e.touches[0].clientX - startX;
  aboutAngle = currentAngle + delta * 0.45;
  gsap.set(aboutCarousel, { rotateY: aboutAngle });
}, { passive: true });

window.addEventListener("touchend", () => {
  aboutDragging = false;
});

if (aboutNext && aboutCarousel) {
  aboutNext.addEventListener("click", () => {
    aboutAngle -= 90;
    gsap.to(aboutCarousel, {
      rotateY: aboutAngle,
      duration: 0.6,
      ease: "power2.out"
    });
  });
}

if (aboutPrev && aboutCarousel) {
  aboutPrev.addEventListener("click", () => {
    aboutAngle += 90;
    gsap.to(aboutCarousel, {
      rotateY: aboutAngle,
      duration: 0.6,
      ease: "power2.out"
    });
  });
}

/* mouse trail dots  شكل تحريك الماوس*/
const colors = [
  "radial-gradient(circle, #ffd6ff 0%, #d946ef 45%, #7e22ce 100%)",
  "radial-gradient(circle, #c4b5fd 0%, #8b5cf6 45%, #ec4899 100%)",
  "radial-gradient(circle, #67e8f9 0%, #3b82f6 45%, #9333ea 100%)"
];

let lastDotTime = 0;

document.addEventListener("mousemove", (e) => {
  const now = Date.now();
  if (now - lastDotTime < 35) return;
  lastDotTime = now;

  const dot = document.createElement("span");
  dot.classList.add("trail-dot");
  dot.style.left = e.clientX + "px";
  dot.style.top = e.clientY + "px";
  dot.style.background = colors[Math.floor(Math.random() * colors.length)];

  document.body.appendChild(dot);

  setTimeout(() => {
    dot.remove();
  }, 700);
});