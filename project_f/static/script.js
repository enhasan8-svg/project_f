/* جزئيه الربوت متاع البحث ورد النتيجه*/
/* جزئيه الربوت المربوطة بالباك أند الحقيقي */
let loadingInterval = null;

async function analyze() {
  const loadingRobot = document.getElementById("loadingRobot");
  const loadingText = document.getElementById("loadingText");
  const fileInput = document.getElementById("fileInput");
  const dashboardContainer = document.getElementById("dashboardContainer");
  const resultText = document.getElementById("resultText");
  const confidenceValue = document.getElementById("confidenceValue");
  const confidenceProgressBar = document.getElementById("confidenceProgressBar");
  const downloadBtn = document.getElementById("downloadBtn");
  
  const camImg = document.getElementById("gradcamImage");
  const heatmapImg = document.getElementById("heatmapImage");
  const originalImg = document.getElementById("originalImage");

  // التحقق من وجود العناصر
  if (!fileInput || !loadingRobot) return;

  // التحقق من اختيار ملف ونوعه
  if (!fileInput.files.length) {
    alert("⚠ Please upload an image first.");
    return;
  }
  
  const file = fileInput.files[0];
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    alert("⚠ Invalid file format! Please upload a JPG or PNG image.");
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    alert("⚠ File is too large! Maximum allowed size is 5MB.");
    return;
  }

  // تجهيز البيانات (الصورة) لإرسالها
  const formData = new FormData();
  formData.append('file', file);

  // إظهار الروبوت وإخفاء لوحة النتائج
  if (dashboardContainer) dashboardContainer.style.display = "none";
  if (downloadBtn) downloadBtn.style.display = "none";
  if (confidenceProgressBar) confidenceProgressBar.style.width = "0%";
  
  loadingRobot.style.display = "block";
  
  // Dynamic Loading Text
  const messages = [
    "Analyzing image structure...",
    "Extracting facial features...",
    "Applying Capsule Networks...",
    "Generating Heatmap (Grad-CAM)...",
    "Finalizing results..."
  ];
  let msgIdx = 0;
  if (loadingText) {
    loadingText.innerText = messages[0];
    loadingInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      loadingText.innerText = messages[msgIdx];
    }, 1500);
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
    clearInterval(loadingInterval);
    loadingRobot.style.display = "none";

    if (data.error) {
      alert(`❌ Error: ${data.error}`);
    } else {
      // إظهار لوحة التحكم (Dashboard)
      if (dashboardContainer) dashboardContainer.style.display = "block";
      if (downloadBtn) downloadBtn.style.display = "inline-block";

      // 1. إظهار النتيجة النصية والنسبة في القسم الذكي
      const isReal = data.result.includes("Real");
      const color = isReal ? "#28a745" : "#dc3545"; // أخضر للحقيقي، أحمر للمزيف
      
      const confidenceNum = parseFloat(data.confidence) * 100;
      const confidencePercent = confidenceNum.toFixed(2) + "%";
      
      if (resultText) {
        resultText.innerText = data.result;
        resultText.style.color = color;
      }
      
      if (confidenceValue) {
        confidenceValue.innerText = confidencePercent;
      }
      
      if (confidenceProgressBar) {
        // أنيميشن لشريط التقدم
        setTimeout(() => {
          confidenceProgressBar.style.width = confidencePercent;
          confidenceProgressBar.style.backgroundColor = color;
        }, 100);
      }

      // 2. إظهار صورة الـ Grad-CAM في التبويب الأول
      if (data.gradcam_url && camImg) {
        const t = "?t=" + new Date().getTime();
        camImg.src = data.gradcam_url + t;
        if (heatmapImg && data.heatmap_url) {
          heatmapImg.src = data.heatmap_url + t;
        }
        if (originalImg && data.original_url) {
          originalImg.src = data.original_url + t;
        }
        
        // Save to recent analyses
        saveRecentAnalysis(
          data.original_url ? data.original_url + t : '',
          data.heatmap_url ? data.heatmap_url + t : '',
          data.gradcam_url ? data.gradcam_url + t : '',
          data.result,
          confidencePercent,
          isReal
        );
      }

      if (typeof gsap !== 'undefined') {
        gsap.from(dashboardContainer, { y: 20, opacity: 0, duration: 0.5, ease: "power2.out" });
      }
    }
  } catch (error) {
    if (loadingInterval) clearInterval(loadingInterval);
    loadingRobot.style.display = "none";
    alert(`❌ Request failed: ${error.message}`);
    console.error("Fetch Error:", error);
  }
}

// Logic for Dashboard Tabs
document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // إزالة الكلاس النشط من جميع الأزرار
      tabBtns.forEach(b => b.classList.remove('active'));
      // إخفاء جميع المحتويات
      tabContents.forEach(c => c.classList.remove('active'));

      // إضافة الكلاس النشط للزر الذي تم النقر عليه
      btn.classList.add('active');
      
      // إظهار المحتوى المرتبط بالزر
      const tabId = btn.getAttribute('data-tab');
      const targetContent = document.getElementById(tabId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
});

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

/* === PDF Download === */
function downloadReport() {
  const reportModal = document.getElementById("reportModal");
  if (!reportModal) return;
  
  // Populate the template with current data
  const resultText = document.getElementById("resultText").innerText;
  const confidenceVal = document.getElementById("confidenceValue").innerText;
  const origImg = document.getElementById("originalImage").src;
  const heatImg = document.getElementById("heatmapImage").src;
  const overlayImg = document.getElementById("gradcamImage").src;

  document.getElementById("reportDate").innerText = "Date: " + new Date().toLocaleString();
  document.getElementById("reportResultText").innerText = resultText;
  document.getElementById("reportResultText").style.color = document.getElementById("resultText").style.color;
  document.getElementById("reportConfidenceValue").innerText = confidenceVal;
  
  document.getElementById("reportOriginalImg").src = origImg;
  document.getElementById("reportHeatmapImg").src = heatImg;
  document.getElementById("reportOverlayImg").src = overlayImg;

  // Show the modal
  reportModal.style.display = "flex";
}

// Report Modal Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const reportModal = document.getElementById("reportModal");
  const closeReportBtn = document.getElementById("closeReportBtn");
  const closeReportOverlay = document.getElementById("closeReportOverlay");
  const confirmDownloadBtn = document.getElementById("confirmDownloadBtn");

  if(closeReportBtn) closeReportBtn.addEventListener("click", () => reportModal.style.display = "none");
  if(closeReportOverlay) closeReportOverlay.addEventListener("click", () => reportModal.style.display = "none");
  
  if(confirmDownloadBtn) {
    confirmDownloadBtn.addEventListener("click", () => {
      const originalPrintArea = document.getElementById("reportPrintArea");
      const reportTemplate = document.getElementById("reportTemplate");
      
      // إزالة قيود التمرير مؤقتاً لضمان التقاط html2canvas لكامل العنصر
      const oldOverflow = reportTemplate.style.overflowY;
      const oldMaxHeight = reportTemplate.style.maxHeight;
      reportTemplate.style.overflowY = "visible";
      reportTemplate.style.maxHeight = "none";

      const opt = {
        margin:       10,
        filename:     'AIG_Detect_Forensic_Report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      confirmDownloadBtn.innerText = "Generating PDF...";
      confirmDownloadBtn.disabled = true;

      // مهلة صغيرة للسماح للمتصفح بتحديث العرض قبل الالتقاط
      setTimeout(() => {
        html2pdf().set(opt).from(originalPrintArea).save().then(() => {
          confirmDownloadBtn.innerText = "Download PDF";
          confirmDownloadBtn.disabled = false;
          
          // إرجاع القيود كما كانت
          reportTemplate.style.overflowY = oldOverflow;
          reportTemplate.style.maxHeight = oldMaxHeight;
        }).catch(err => {
          console.error("PDF Error: ", err);
          confirmDownloadBtn.innerText = "Download PDF";
          confirmDownloadBtn.disabled = false;
          reportTemplate.style.overflowY = oldOverflow;
          reportTemplate.style.maxHeight = oldMaxHeight;
        });
      }, 300);
    });
  }
});

/* === Recent Analyses (History) === */
function saveRecentAnalysis(origUrl, heatmapUrl, gradcamUrl, resultText, confidence, isReal) {
  let recent = JSON.parse(localStorage.getItem("recentAnalyses")) || [];
  
  recent.unshift({ 
    origUrl: origUrl, 
    heatmapUrl: heatmapUrl, 
    gradcamUrl: gradcamUrl, 
    result: resultText, 
    confidence: confidence, 
    isReal: isReal,
    date: new Date().toLocaleString()
  });
  
  if (recent.length > 3) {
    recent.pop();
  }
  
  localStorage.setItem("recentAnalyses", JSON.stringify(recent));
  loadRecentAnalyses();
}

function loadRecentAnalyses() {
  const historyGrid = document.getElementById("historyGrid");
  if (!historyGrid) return;
  
  let recent = JSON.parse(localStorage.getItem("recentAnalyses")) || [];
  
  if (recent.length === 0) {
    historyGrid.innerHTML = "<p style='color:#bbb; text-align:center;'>No recent analyses yet.</p>";
    return;
  }
  
  historyGrid.innerHTML = "";
  
  recent.forEach(item => {
    const div = document.createElement("div");
    div.className = `history-item ${item.isReal ? 'real' : 'fake'}`;
    
    div.innerHTML = `
      <img src="${item.origUrl}" alt="Thumbnail">
      <div class="history-item-details">
        <h4 style="color: ${item.isReal ? '#28a745' : '#dc3545'}; margin-bottom: 5px; font-size: 18px;">${item.result}</h4>
        <p style="font-size: 13px; color: #c4b5fd;">Confidence: ${item.confidence}</p>
        <p style="font-size: 11px; opacity: 0.7; color: #bbb; margin-top: 5px;">${item.date || ''}</p>
      </div>
    `;
    
    // On click, restore the dashboard
    div.addEventListener("click", () => {
      document.getElementById("historyModal").classList.remove("active");
      document.getElementById("historyModal").style.display = "none";
      
      const dashboardContainer = document.getElementById("dashboardContainer");
      const resultText = document.getElementById("resultText");
      const confidenceValue = document.getElementById("confidenceValue");
      const confidenceProgressBar = document.getElementById("confidenceProgressBar");
      const downloadBtn = document.getElementById("downloadBtn");
      
      if (dashboardContainer) dashboardContainer.style.display = "block";
      if (downloadBtn) downloadBtn.style.display = "inline-block";
      
      if (resultText) {
        resultText.innerText = item.result;
        resultText.style.color = item.isReal ? "#28a745" : "#dc3545";
      }
      if (confidenceValue) {
        confidenceValue.innerText = item.confidence;
      }
      if (confidenceProgressBar) {
        confidenceProgressBar.style.width = item.confidence;
        confidenceProgressBar.style.backgroundColor = item.isReal ? "#28a745" : "#dc3545";
      }
      
      const camImg = document.getElementById("gradcamImage");
      const heatmapImg = document.getElementById("heatmapImage");
      const originalImg = document.getElementById("originalImage");
      
      if (camImg && item.gradcamUrl) camImg.src = item.gradcamUrl;
      if (heatmapImg && item.heatmapUrl) heatmapImg.src = item.heatmapUrl;
      if (originalImg && item.origUrl) originalImg.src = item.origUrl;
      
      const previewImage = document.getElementById("previewImage");
      if (previewImage && item.origUrl) {
        previewImage.src = item.origUrl;
        previewImage.style.display = "block";
      }
      
      window.scrollTo({ top: document.getElementById('upload').offsetTop, behavior: 'smooth' });
    });
    
    historyGrid.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadRecentAnalyses();
  
  // History Modal Toggle
  const openHistory = document.getElementById("openHistory");
  const historyModal = document.getElementById("historyModal");
  const closeHistoryBtn = document.getElementById("closeHistoryBtn");
  const closeHistoryOverlay = document.getElementById("closeHistoryOverlay");
  
  if (openHistory && historyModal) {
    openHistory.addEventListener("click", (e) => {
      e.preventDefault();
      historyModal.style.display = "flex";
      historyModal.classList.add("active");
      loadRecentAnalyses();
    });
  }
  
  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener("click", () => {
      historyModal.style.display = "none";
      historyModal.classList.remove("active");
    });
  }
  if (closeHistoryOverlay) {
    closeHistoryOverlay.addEventListener("click", () => {
      historyModal.style.display = "none";
      historyModal.classList.remove("active");
    });
  }
});