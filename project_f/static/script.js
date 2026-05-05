const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

const app = createApp({
  delimiters: ['[[', ']]'],
  setup() {
    // Theme
    const isDark = ref(false); // Light theme as per screenshots
    const showAbout = ref(false);

    // Scanner State
    const isDragging = ref(false);
    const selectedFile = ref(null);
    const previewUrl = ref(null);
    const isAnalyzing = ref(false);
    const hasResult = ref(false);
    const errorMessage = ref("");

    // Multi-Face Data
    const resultData = ref(null);
    // currentStep 1 to 5
    const currentStep = ref(1);

    const steps = [
      { id: 1, name: 'معلومات الصورة', icon: 'ph-image' },
      { id: 2, name: 'تجزئة الأوجه', icon: 'ph-users' },
      { id: 3, name: 'الحكم (Verdict)', icon: 'ph-scales' },
      { id: 4, name: 'Grad-CAM', icon: 'ph-eye' },
      { id: 5, name: 'ELA', icon: 'ph-magnifying-glass' }
    ];

    // Terminal Logs
    const terminalLogs = ref([]);
    const defaultLogs = [
      "Initiating deep scan protocol...",
      "Extracting facial bounding boxes...",
      "Isolating face regions...",
      "Routing features through Capsule Network...",
      "Calculating Error Level Analysis variance...",
      "Compiling Grad-CAM visual explanation...",
      "Finalizing forensic report..."
    ];

    const getFaceVerdictClass = (result) => {
      if (result.includes("Real")) return "verdict-real";
      if (result.includes("Fake") || result.includes("Manipulated")) return "verdict-fake";
      return "verdict-uncertain";
    };

    const getFaceElaClass = (analysis) => {
      if (analysis.includes("AUTHENTIC")) return "verdict-real";
      if (analysis.includes("MANIPULATED")) return "verdict-fake";
      return "verdict-uncertain";
    };

    const getElaStatus = (analysis) => {
      if (analysis.includes("AUTHENTIC")) return "AUTHENTIC";
      if (analysis.includes("MANIPULATED")) return "MANIPULATED";
      return "UNCERTAIN";
    };

    // File Handling
    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      processFile(file);
    };

    const handleDrop = (event) => {
      isDragging.value = false;
      const file = event.dataTransfer.files[0];
      processFile(file);
    };

    const processFile = (file) => {
      if (!file) return;
      if (!file.type.match('image.*')) {
        alert("Please upload a valid image file (JPG/PNG).");
        return;
      }
      selectedFile.value = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        previewUrl.value = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    const clearFile = () => {
      selectedFile.value = null;
      previewUrl.value = null;
      hasResult.value = false;
      errorMessage.value = "";
      currentStep.value = 1;
    };

    const resetScanner = () => {
      clearFile();
      hasResult.value = false;
      isAnalyzing.value = false;
      errorMessage.value = "";
      currentStep.value = 1;
    };

    const nextStep = () => {
      if (currentStep.value < 5) currentStep.value++;
    };

    const prevStep = () => {
      if (currentStep.value > 1) currentStep.value--;
    };

    // Analysis Logic
    const executeAnalysis = async () => {
      if (!selectedFile.value) return;

      isAnalyzing.value = true;
      terminalLogs.value = [];

      let logIdx = 0;
      const logInterval = setInterval(() => {
        if (logIdx < defaultLogs.length) {
          terminalLogs.value.push(defaultLogs[logIdx]);
          logIdx++;
        }
      }, 500);

      const formData = new FormData();
      formData.append("file", selectedFile.value);

      try {
        const response = await fetch("/predict", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.error) {
          errorMessage.value = data.error;
          isAnalyzing.value = false;
          clearInterval(logInterval);
          return;
        }

        setTimeout(() => {
          clearInterval(logInterval);
          resultData.value = data;
          isAnalyzing.value = false;
          hasResult.value = true;
          currentStep.value = 1;
        }, 1500);

      } catch (err) {
        alert("Network error during analysis.");
        console.error(err);
        isAnalyzing.value = false;
        clearInterval(logInterval);
      }
    };

    return {
      isDark, showAbout,

      isDragging, selectedFile, previewUrl, isAnalyzing, hasResult, errorMessage,
      handleFileSelect, handleDrop, clearFile, resetScanner, executeAnalysis,
      terminalLogs,

      resultData, currentStep, steps,
      nextStep, prevStep,
      getFaceVerdictClass, getFaceElaClass, getElaStatus
    };
  }
});

app.mount('#app');