// --- Theme Toggle ---
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

// --- File Upload Preview ---
const fileInput = document.getElementById("fileInput");
const previewWrapper = document.getElementById("previewWrapper");
const previewImage = document.getElementById("previewImage");

if (fileInput && previewImage) {
  fileInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        previewImage.src = e.target.result;
        previewWrapper.style.display = "inline-block";
        document.getElementById("dashboardContainer").style.display = "none";
      };
      reader.readAsDataURL(file);
    }
  });
}

// --- Terminal Simulator ---
const terminalLogs = document.getElementById("terminalLogs");
let logInterval;

function startTerminalSimulation() {
  if(!terminalLogs) return;
  terminalLogs.innerHTML = `<div class="log-line">> Initiating deep scan protocol...</div>`;
  
  const logs = [
    "> Extracting pixel metadata...",
    "> Initializing VGG-19 feature extraction...",
    "> Passing tensors to Capsule Layers...",
    "> Computing dynamic routing weights...",
    "> Calculating Class Activation Maps (Grad-CAM)...",
    "> Finalizing confidence vector..."
  ];
  
  let i = 0;
  logInterval = setInterval(() => {
    if(i < logs.length) {
      const div = document.createElement('div');
      div.className = 'log-line';
      div.innerText = logs[i];
      terminalLogs.appendChild(div);
      terminalLogs.scrollTop = terminalLogs.scrollHeight;
      i++;
    } else {
      clearInterval(logInterval);
    }
  }, 800);
}

function stopTerminalSimulation() {
  if(logInterval) clearInterval(logInterval);
}

// --- Analyze Logic ---
const analyzeBtn = document.getElementById("analyzeBtn");

if(analyzeBtn) {
  analyzeBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("⚠ Please select a target file first.");
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert("⚠ Invalid file format! Please upload a JPG or PNG image.");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert("⚠ File is too large! Maximum allowed size is 5MB.");
      return;
    }

    // UI State: Loading
    const terminalLoader = document.getElementById("terminalLoader");
    const dashboardContainer = document.getElementById("dashboardContainer");
    const cyberLaser = document.getElementById("laserScanner");
    
    dashboardContainer.style.display = "none";
    terminalLoader.style.display = "block";
    cyberLaser.style.opacity = "1";
    
    // Animate Laser
    if(typeof gsap !== 'undefined') {
      gsap.fromTo(cyberLaser, 
          { top: "0%" }, 
          { top: "100%", duration: 1.5, repeat: -1, yoyo: true, ease: "linear" }
      );
    }
    
    startTerminalSimulation();
    
    // Prepare Data
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/predict', {
        method: 'POST',
        body: formData
      });
      
      let data = null;
      try { data = await response.json(); } catch (_) { data = null; }

      if (!response.ok) {
        const serverMsg = data?.error ? ` (${data.error})` : "";
        throw new Error(`HTTP ${response.status}${serverMsg}`);
      }
      
      stopTerminalSimulation();
      terminalLoader.style.display = "none";
      cyberLaser.style.opacity = "0";
      if(typeof gsap !== 'undefined') gsap.killTweensOf(cyberLaser);
      
      if (data.error) {
        alert(`❌ Analysis Error: ${data.error}`);
        return;
      }
      
      // Populate Dashboard
      populateDashboard(data);
      
      // Show Dashboard with Animation
      dashboardContainer.style.display = "block";
      if(typeof gsap !== 'undefined') {
        gsap.from(dashboardContainer, { y: 30, opacity: 0, duration: 0.6, ease: "power3.out" });
      }
      
    } catch(err) {
      stopTerminalSimulation();
      terminalLoader.style.display = "none";
      cyberLaser.style.opacity = "0";
      alert(`❌ Request Failed: ${err.message}`);
    }
  });
}

function populateDashboard(data) {
  const isReal = data.result.includes("Real");
  const color = isReal ? "#00FFA3" : "#FF3366"; // Neon Green for Real, Crimson for Fake
  const confNum = parseFloat(data.confidence) * 100;
  const confPercentStr = confNum.toFixed(1) + "%";
  
  // Verdict
  const resultText = document.getElementById("resultText");
  resultText.innerText = data.result;
  resultText.style.color = color;
  
  // Confidence Meter
  document.getElementById("confidenceValue").innerText = confPercentStr;
  const circle = document.getElementById("confidenceCircle");
  
  // Dasharray calculation for 36x36 viewBox svg circle is ~100
  setTimeout(() => {
    circle.style.strokeDasharray = `${confNum}, 100`;
    circle.style.stroke = color;
  }, 100);
  
  // Images
  const t = "?t=" + new Date().getTime();
  const origSrc = data.original_url ? data.original_url + t : '';
  const heatSrc = data.heatmap_url ? data.heatmap_url + t : '';
  const gradSrc = data.gradcam_url ? data.gradcam_url + t : '';
  
  if(data.original_url) document.getElementById("originalImage").src = origSrc;
  if(data.heatmap_url) document.getElementById("heatmapImage").src = heatSrc;
  if(data.gradcam_url) document.getElementById("gradcamImage").src = gradSrc;
  
  // Save History
  saveHistoryLog({
    verdict: data.result,
    confidence: confPercentStr,
    isReal: isReal,
    thumb: origSrc,
    heatmap: heatSrc,
    overlay: gradSrc,
    date: new Date().toLocaleString()
  });
}

// --- Tabs Logic (Custom Classes) ---
document.querySelectorAll('.tab-btn-custom').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn-custom').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane-custom').forEach(p => p.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// --- Modals Logic ---
function setupModal(openBtnIds, modalId, closeBtnClassIds) {
  const modal = document.getElementById(modalId);
  if(!modal) return;
  
  openBtnIds.forEach(id => {
    const btn = document.getElementById(id);
    if(btn) btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = "flex";
      modal.classList.add("active");
    });
  });
  
  closeBtnClassIds.forEach(id => {
    const btn = document.getElementById(id);
    if(btn) btn.addEventListener('click', () => {
      modal.style.display = "none";
      modal.classList.remove("active");
    });
  });
  
  const overlays = modal.querySelectorAll('.about-overlay');
  overlays.forEach(overlay => {
    overlay.addEventListener('click', () => {
        modal.style.display = "none";
        modal.classList.remove("active");
    });
  });
}

setupModal(["openAbout"], "aboutModal", ["closeAboutBtn"]);
setupModal(["openHistory"], "historyModal", ["closeHistoryBtn"]);
setupModal([], "reportModal", ["closeReportBtn"]); // Open triggered by JS below


// --- PDF Generation ---
document.addEventListener('DOMContentLoaded', () => {
  const downloadBtn = document.getElementById("downloadBtn");
  const confirmDownloadBtn = document.getElementById("confirmDownloadBtn");
  const reportModal = document.getElementById("reportModal");
  
  if(downloadBtn && reportModal) {
    downloadBtn.addEventListener('click', () => {
      document.getElementById("reportResultText").innerText = document.getElementById("resultText").innerText;
      document.getElementById("reportResultText").style.color = document.getElementById("resultText").style.color;
      document.getElementById("reportConfidenceValue").innerText = document.getElementById("confidenceValue").innerText;
      document.getElementById("reportDate").innerText = "Date: " + new Date().toLocaleString();
      
      document.getElementById("reportOriginalImg").src = document.getElementById("originalImage").src;
      document.getElementById("reportHeatmapImg").src = document.getElementById("heatmapImage").src;
      document.getElementById("reportOverlayImg").src = document.getElementById("gradcamImage").src;
      
      reportModal.style.display = "flex";
      reportModal.classList.add("active");
    });
  }
  
  if(confirmDownloadBtn) {
    confirmDownloadBtn.addEventListener('click', () => {
      confirmDownloadBtn.innerText = "Generating PDF...";
      confirmDownloadBtn.disabled = true;

      setTimeout(() => {
          try {
              const { jsPDF } = window.jspdf;
              const doc = new jsPDF('p', 'mm', 'a4');
              
              // Helper to get image data safely
              const getImgData = (imgEl) => {
                  try {
                      const canvas = document.createElement('canvas');
                      canvas.width = imgEl.naturalWidth || 200;
                      canvas.height = imgEl.naturalHeight || 200;
                      const ctx = canvas.getContext('2d');
                      ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
                      return canvas.toDataURL('image/jpeg', 0.95);
                  } catch (e) {
                      console.error("Could not capture image:", e);
                      return null;
                  }
              };

              const origImg = document.getElementById("originalImage");
              const heatImg = document.getElementById("heatmapImage");
              const gradImg = document.getElementById("gradcamImage");

              const origData = getImgData(origImg);
              const heatData = getImgData(heatImg);
              const gradData = getImgData(gradImg);

              const resultTxt = document.getElementById("resultText").innerText;
              const confTxt = document.getElementById("confidenceValue").innerText;

              // --- Header ---
              doc.setFillColor(26, 15, 36); // Dark purple #1a0f24
              doc.rect(0, 0, 210, 40, 'F');
              
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(24);
              doc.setFont("helvetica", "bold");
              doc.text("AIG-Detect Forensic Report", 20, 25);
              
              doc.setFontSize(12);
              doc.setFont("helvetica", "normal");
              doc.text("Date: " + new Date().toLocaleString(), 20, 33);

              // --- Section 1 ---
              doc.setTextColor(0, 0, 0);
              doc.setFontSize(18);
              doc.setFont("helvetica", "bold");
              doc.text("1. Classification Result", 20, 60);
              
              doc.setDrawColor(200, 200, 200);
              doc.setLineWidth(0.5);
              doc.line(20, 63, 190, 63);

              doc.setFontSize(14);
              doc.setFont("helvetica", "normal");
              doc.text("Result: ", 20, 75);
              doc.setFont("helvetica", "bold");
              if (resultTxt.toLowerCase().includes("real")) {
                  doc.setTextColor(40, 167, 69); // Green
              } else {
                  doc.setTextColor(220, 53, 69); // Red
              }
              doc.text(resultTxt, 40, 75);
              
              doc.setTextColor(0, 0, 0);
              doc.setFont("helvetica", "normal");
              doc.text("Confidence Score: ", 20, 85);
              doc.setFont("helvetica", "bold");
              doc.text(confTxt, 65, 85);

              // --- Section 2 ---
              doc.setFontSize(18);
              doc.setFont("helvetica", "bold");
              doc.text("2. Visual Analysis (Grad-CAM)", 20, 110);
              doc.line(20, 113, 190, 113);

              // Images (3 columns)
              const imgWidth = 50;
              const imgHeight = 50;
              
              doc.setFontSize(12);
              doc.setFont("helvetica", "bold");
              doc.text("Original", 35, 125, { align: "center" });
              doc.text("Heatmap", 105, 125, { align: "center" });
              doc.text("Overlay", 175, 125, { align: "center" });

              if (origData) doc.addImage(origData, 'JPEG', 10, 130, imgWidth, imgHeight);
              if (heatData) doc.addImage(heatData, 'JPEG', 80, 130, imgWidth, imgHeight);
              if (gradData) doc.addImage(gradData, 'JPEG', 150, 130, imgWidth, imgHeight);

              // Note
              doc.setFontSize(10);
              doc.setFont("helvetica", "italic");
              doc.setTextColor(100, 100, 100);
              doc.text("* Highlighted regions indicate areas the AI focused on to make its decision.", 105, 195, { align: "center" });

              // --- Footer ---
              doc.setDrawColor(230, 230, 230);
              doc.setLineWidth(0.5);
              doc.line(20, 280, 190, 280);
              doc.setFontSize(10);
              doc.setFont("helvetica", "normal");
              doc.setTextColor(150, 150, 150);
              doc.text("Generated by AI Image Detector (Graduation Project)", 105, 287, { align: "center" });

              // Save the file
              doc.save("AIG_Detect_Forensic_Report.pdf");

          } catch (err) {
              console.error("PDF generation error:", err);
              alert("An error occurred while generating the PDF.");
          } finally {
              confirmDownloadBtn.innerText = "Download PDF";
              confirmDownloadBtn.disabled = false;
          }
      }, 100);
    });
  }
});

// --- History Logic ---
function saveHistoryLog(log) {
  let logs = JSON.parse(localStorage.getItem("aig_history")) || [];
  logs.unshift(log);
  if(logs.length > 5) logs.pop(); // Keep last 5
  localStorage.setItem("aig_history", JSON.stringify(logs));
  renderHistoryLogs();
}

function renderHistoryLogs() {
  const grid = document.getElementById("historyGrid");
  if(!grid) return;
  
  let logs = JSON.parse(localStorage.getItem("aig_history")) || [];
  
  if(logs.length === 0) {
    grid.innerHTML = "<p style='color: #c4b5fd; text-align: center;'>No recent analyses yet.</p>";
    return;
  }
  
  grid.innerHTML = "";
  logs.forEach(log => {
    const div = document.createElement("div");
    div.className = `history-item ${log.isReal ? 'real' : 'fake'}`;
    div.innerHTML = `
      <img src="${log.thumb}" alt="Thumbnail">
      <div class="history-item-details">
        <h4 style="color: ${log.isReal ? '#00FFA3' : '#FF3366'}">${log.verdict}</h4>
        <p>Confidence: ${log.confidence}</p>
        <p style="font-size:11px; opacity:0.7;">${log.date}</p>
      </div>
    `;
    
    div.addEventListener('click', () => {
      document.getElementById('historyModal').style.display = 'none';
      
      const dashboard = document.getElementById("dashboardContainer");
      dashboard.style.display = "block";
      
      const color = log.isReal ? "#00FFA3" : "#FF3366";
      
      const resultText = document.getElementById("resultText");
      resultText.innerText = log.verdict;
      resultText.style.color = color;
      
      document.getElementById("confidenceValue").innerText = log.confidence;
      const circle = document.getElementById("confidenceCircle");
      circle.style.strokeDasharray = `${parseFloat(log.confidence)}, 100`;
      circle.style.stroke = color;
      
      document.getElementById("originalImage").src = log.thumb;
      document.getElementById("heatmapImage").src = log.heatmap;
      document.getElementById("gradcamImage").src = log.overlay;
      
      const previewImage = document.getElementById("previewImage");
      if(previewImage) {
        previewImage.src = log.thumb;
        document.getElementById("previewWrapper").style.display = "inline-block";
      }
      
      window.scrollTo({ top: document.getElementById('upload').offsetTop, behavior: 'smooth' });
    });
    
    grid.appendChild(div);
  });
}

renderHistoryLogs();


// --- Original 3D About Carousel Logic ---
const aboutCarousel = document.getElementById("aboutCarousel");
const aboutCards = document.querySelectorAll(".about-card");
const aboutPrev = document.getElementById("aboutPrev");
const aboutNext = document.getElementById("aboutNext");
const openAbout = document.getElementById("openAbout");

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
    if(typeof gsap !== 'undefined') {
        gsap.set(card, {
        rotateY: cardAngle,
        transformOrigin: `50% 50% ${-aboutRadius}px`,
        z: aboutRadius
        });
    }
  });

  if(typeof gsap !== 'undefined') {
      gsap.set(aboutCarousel, {
        rotateY: aboutAngle,
        transformStyle: "preserve-3d"
      });
  }

  aboutInitialized = true;
}

if (openAbout) {
  openAbout.addEventListener("click", () => {
    setupAboutCarousel();
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
  if(typeof gsap !== 'undefined') gsap.set(aboutCarousel, { rotateY: aboutAngle });
});

window.addEventListener("mouseup", () => {
  aboutDragging = false;
  if (aboutCarousel) aboutCarousel.style.cursor = "grab";
});

window.addEventListener("touchmove", (e) => {
  if (!aboutDragging || !aboutCarousel) return;
  const delta = e.touches[0].clientX - startX;
  aboutAngle = currentAngle + delta * 0.45;
  if(typeof gsap !== 'undefined') gsap.set(aboutCarousel, { rotateY: aboutAngle });
}, { passive: true });

window.addEventListener("touchend", () => {
  aboutDragging = false;
});

if (aboutNext && aboutCarousel) {
  aboutNext.addEventListener("click", () => {
    aboutAngle -= 60; // 6 cards = 60 degrees each
    if(typeof gsap !== 'undefined') {
        gsap.to(aboutCarousel, {
        rotateY: aboutAngle,
        duration: 0.6,
        ease: "power2.out"
        });
    }
  });
}

if (aboutPrev && aboutCarousel) {
  aboutPrev.addEventListener("click", () => {
    aboutAngle += 60;
    if(typeof gsap !== 'undefined') {
        gsap.to(aboutCarousel, {
        rotateY: aboutAngle,
        duration: 0.6,
        ease: "power2.out"
        });
    }
  });
}

// --- Original Mouse Trail Dots ---
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