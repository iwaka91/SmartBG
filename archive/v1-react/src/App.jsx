import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, Image as ImageIcon, Eraser, Undo, Redo, Download, 
  Sparkles, MousePointer2, PaintBrush, Droplet, Layers, 
  Settings, X, Loader2, Check, AlertCircle, Maximize, FileImage
} from 'lucide-react';

const MAX_IMAGE_DIMENSION = 1920; // Limit processing size for performance
const HISTORY_LIMIT = 20;

// Default background colors for presets
const BG_COLORS = [
  { name: 'Transparan', value: 'transparent' },
  { name: 'Putih', value: '#ffffff' },
  { name: 'Hitam', value: '#000000' },
  { name: 'Abu-abu', value: '#f3f4f6' },
  { name: 'Merah Pas Foto', value: '#db2777' },
  { name: 'Biru Pas Foto', value: '#2563eb' },
];

// Load image from File or URL to HTMLImageElement
const loadImage = (source) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const objectUrl = source instanceof File || source instanceof Blob ? URL.createObjectURL(source) : null;
    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (error) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(error);
    };
    img.src = objectUrl || source;
  });
};

// Resize image to prevent massive memory usage on huge files
const resizeImageIfNeed = async (imgElement) => {
  let width = imgElement.naturalWidth;
  let height = imgElement.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgElement, 0, 0, width, height);
  
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Gagal mengonversi gambar.')), 'image/png');
  });
};

// Load imgly background removal dynamically
const loadImgly = async () => {
  try {
    if (window.imglyRemoveBackground) return window.imglyRemoveBackground;
    // Attempt dynamic import from unpkg
    const module = await import('@imgly/background-removal');
    return module.default || module.removeBackground;
  } catch (error) {
    console.error("Failed to load imgly module:", error);
    throw new Error("Gagal memuat modul AI lokal.");
  }
};

export default function SmartBackgroundRemover() {
  // App State
  const [appState, setAppState] = useState('home'); // 'home', 'processing', 'editor'
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);

  // Image Data
  const [originalFile, setOriginalFile] = useState(null);
  const [originalImgData, setOriginalImgData] = useState(null); // HTMLImageElement
  const [processedImgData, setProcessedImgData] = useState(null); // HTMLImageElement
  
  // Editor State
  const [activeTool, setActiveTool] = useState('background'); // 'background', 'erase', 'restore', 'ai'
  const [bgSettings, setBgSettings] = useState({ type: 'transparent', value: null }); // type: transparent, color, image, blur
  const [brushSettings, setBrushSettings] = useState({ size: 30, softness: 50 });
  const [isComparing, setIsComparing] = useState(false);
  
  // Undo/Redo System
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Gemini AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Canvas Refs
  const displayCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const originalCanvasRef = useRef(null); // Offscreen for quick compositing
  const bgCanvasRef = useRef(null); // Offscreen for background
  const containerRef = useRef(null);

  const handleProcessImage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg("Harap pilih file gambar (JPG, PNG, dll).");
      return;
    }

    setAppState('processing');
    setErrorMsg(null);
    setLoadingProgress(0);
    setOriginalFile(file);

    try {
      setLoadingMsg('Menyiapkan gambar...');
      const imgElem = await loadImage(file);
      const optimizedBlob = await resizeImageIfNeed(imgElem);
      setOriginalImgData(await loadImage(optimizedBlob));

      setLoadingMsg('Memuat model AI lokal...');
      const removeBg = await loadImgly();

      setLoadingMsg('Menghapus background (ini mungkin memakan waktu sebentar)...');
      
      const config = {
        progress: (key, current, total) => {
          if (total > 0) {
             const prog = Math.round((current / total) * 100);
             setLoadingProgress(prog);
          }
        }
      };

      const resultBlob = await removeBg(optimizedBlob, config);
      
      setLoadingMsg('Menyempurnakan hasil...');
      const resultImgElem = await loadImage(resultBlob);
      setProcessedImgData(resultImgElem);
      
      setAppState('editor');
    } catch (error) {
      console.error(error);
      setErrorMsg("Gagal menghapus background secara otomatis. Anda dapat mencoba lagi atau menggunakan foto lain.");
      setAppState('home');
    }
  };

  const initializeCanvases = useCallback(() => {
    if (!originalImgData || !processedImgData || !displayCanvasRef.current) return;

    const width = originalImgData.naturalWidth;
    const height = originalImgData.naturalHeight;

    // Initialize Offscreen Canvases
    if (!originalCanvasRef.current) originalCanvasRef.current = document.createElement('canvas');
    if (!maskCanvasRef.current) maskCanvasRef.current = document.createElement('canvas');
    if (!bgCanvasRef.current) bgCanvasRef.current = document.createElement('canvas');

    const origCtx = originalCanvasRef.current.getContext('2d');
    const maskCtx = maskCanvasRef.current.getContext('2d');
    const bgCtx = bgCanvasRef.current.getContext('2d', { willReadFrequently: true });

    [originalCanvasRef.current, maskCanvasRef.current, bgCanvasRef.current, displayCanvasRef.current].forEach(cvs => {
      if(cvs) {
        cvs.width = width;
        cvs.height = height;
      }
    });

    // 1. Draw Original Image
    origCtx.drawImage(originalImgData, 0, 0);

    // 2. Generate Initial Mask from Processed Image
    // Draw the transparent result to mask canvas
    maskCtx.clearRect(0, 0, width, height);
    maskCtx.drawImage(processedImgData, 0, 0);
    
    // Convert image pixels into a white-alpha transparency mask for editing
    const imageData = maskCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // If pixel has some opacity, make it fully white in mask, else black
      // We use a small threshold to clean up edges slightly
      const alpha = data[i + 3];
      if (alpha > 10) {
        data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = alpha;
      } else {
        data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 0; // transparent mask
      }
    }
    maskCtx.putImageData(imageData, 0, 0);

    // Save initial state to history
    saveHistoryState(maskCanvasRef.current);
    
    updateDisplay();
  }, [originalImgData, processedImgData]);

  useEffect(() => {
    if (appState === 'editor') {
      // Small delay to ensure refs are bound
      const frame = requestAnimationFrame(initializeCanvases);
      return () => cancelAnimationFrame(frame);
    }
  }, [appState, initializeCanvases]);


  const updateDisplay = useCallback(async () => {
    if (!displayCanvasRef.current || !originalCanvasRef.current || !maskCanvasRef.current) return;

    const displayCtx = displayCanvasRef.current.getContext('2d');
    const width = displayCanvasRef.current.width;
    const height = displayCanvasRef.current.height;

    displayCtx.clearRect(0, 0, width, height);

    if (isComparing) {
      // Just show original
      displayCtx.drawImage(originalCanvasRef.current, 0, 0);
      return;
    }

    // 1. Draw Background
    const bgCtx = bgCanvasRef.current.getContext('2d');
    bgCtx.clearRect(0, 0, width, height);

    if (bgSettings.type === 'color') {
      bgCtx.fillStyle = bgSettings.value;
      bgCtx.fillRect(0, 0, width, height);
    } else if (bgSettings.type === 'image' && bgSettings.imgElement) {
      // Draw image covering the canvas
      const img = bgSettings.imgElement;
      const scale = Math.max(width / img.width, height / img.height);
      const x = (width / 2) - (img.width / 2) * scale;
      const y = (height / 2) - (img.height / 2) * scale;
      bgCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
    } else if (bgSettings.type === 'blur') {
       bgCtx.filter = `blur(${bgSettings.blurAmount || 10}px)`;
       bgCtx.drawImage(originalCanvasRef.current, 0, 0);
       bgCtx.filter = 'none';
       // Darken slightly to make foreground pop
       bgCtx.fillStyle = 'rgba(0,0,0,0.1)';
       bgCtx.fillRect(0,0,width,height);
    }

    // Draw Background to Display
    if (bgSettings.type !== 'transparent') {
      displayCtx.drawImage(bgCanvasRef.current, 0, 0);
    }

    // 2. Composite Foreground using Mask
    // Create a temporary canvas for compositing
    const tempCvs = document.createElement('canvas');
    tempCvs.width = width;
    tempCvs.height = height;
    const tempCtx = tempCvs.getContext('2d');

    // Draw alpha Mask
    tempCtx.drawImage(maskCanvasRef.current, 0, 0);
    // Composite Original IN Mask (where mask is white, keep original)
    tempCtx.globalCompositeOperation = 'source-in';
    tempCtx.drawImage(originalCanvasRef.current, 0, 0);

    // Draw Composited Foreground to Display
    displayCtx.drawImage(tempCvs, 0, 0);

  }, [bgSettings, isComparing]);

  useEffect(() => {
    updateDisplay();
  }, [updateDisplay, bgSettings, isComparing]);


  const isDrawing = useRef(false);
  const lastPos = useRef(null);

  const getPointerPos = (e) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Handle both touch and mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e) => {
    if (activeTool !== 'erase' && activeTool !== 'restore') return;
    if (isComparing) return;
    
    isDrawing.current = true;
    lastPos.current = getPointerPos(e);
    drawOnMask(lastPos.current, lastPos.current);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing.current || isComparing) return;
    // Prevent scrolling when drawing on touch devices
    if (e.cancelable) e.preventDefault();

    const currentPos = getPointerPos(e);
    if (currentPos && lastPos.current) {
      drawOnMask(lastPos.current, currentPos);
      lastPos.current = currentPos;
    }
  };

  const handlePointerUp = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      saveHistoryState(maskCanvasRef.current);
    }
  };

  const drawOnMask = (start, end) => {
    const maskCtx = maskCanvasRef.current.getContext('2d');
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';
    maskCtx.lineWidth = brushSettings.size;
    
    // Softness simulation: blur filter on context (can be slow, but simple)
    // For performance, we stick to solid brush in MVP, but can add shadowBlur for softness
    if (brushSettings.softness > 0) {
        maskCtx.shadowBlur = brushSettings.softness;
        maskCtx.shadowColor = 'white';
    } else {
        maskCtx.shadowBlur = 0;
    }

    maskCtx.strokeStyle = 'white';
    
    // Erase removes mask alpha; restore paints opaque white alpha.
    maskCtx.globalCompositeOperation = activeTool === 'erase' ? 'destination-out' : 'source-over';

    maskCtx.beginPath();
    maskCtx.moveTo(start.x, start.y);
    maskCtx.lineTo(end.x, end.y);
    maskCtx.stroke();
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.shadowBlur = 0;

    updateDisplay();
  };

  const saveHistoryState = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    
    if (newHistory.length > HISTORY_LIMIT) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      restoreMaskState(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      restoreMaskState(history[newIndex]);
    }
  };

  const restoreMaskState = (imageData) => {
    const ctx = maskCanvasRef.current.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    updateDisplay();
  };


  const handleBgColorSelect = (color) => {
    if (color === 'transparent') {
      setBgSettings({ type: 'transparent', value: null });
    } else {
      setBgSettings({ type: 'color', value: color });
    }
  };

  const handleBgImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = await loadImage(file);
      setBgSettings({ type: 'image', value: 'custom', imgElement: img });
    }
  };

  const applyBlurBg = () => {
    setBgSettings({ type: 'blur', blurAmount: 15 });
  };


  const generateAIBg = async () => {
    if (!geminiKey) {
      setShowKeyModal(true);
      return;
    }
    if (!aiPrompt.trim()) return;

    setIsGeneratingAI(true);
    setErrorMsg(null);

    try {
      // 1. Get the current foreground image as base64
      const tempCvs = document.createElement('canvas');
      tempCvs.width = displayCanvasRef.current.width;
      tempCvs.height = displayCanvasRef.current.height;
      const tempCtx = tempCvs.getContext('2d');
      
      // Draw Mask
      tempCtx.drawImage(maskCanvasRef.current, 0, 0);
      // Composite Original IN Mask
      tempCtx.globalCompositeOperation = 'source-in';
      tempCtx.drawImage(originalCanvasRef.current, 0, 0);

      const base64DataUrl = tempCvs.toDataURL('image/png');
      const base64Data = base64DataUrl.split(',')[1];

      // 2. Call Gemini API
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${geminiKey}`;
      
      const promptText = `
        Ganti latar belakang gambar ini. 
        Instruksi penting: JANGAN mengubah subjek utama (orang, produk, atau objek yang sudah diseleksi).
        Fokus HANYA pada latar belakang.
        Latar belakang yang diinginkan: ${aiPrompt}
      `;

      const payload = {
        contents: [{
            role: "user",
            parts: [
                { text: promptText },
                {
                    inlineData: {
                        mimeType: "image/png",
                        data: base64Data
                    }
                }
            ]
        }],
        generationConfig: {
          responseModalities: ['IMAGE']
        }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
         const errData = await response.json();
         throw new Error(errData?.error?.message || "Gagal menghubungi Gemini API.");
      }

      const result = await response.json();
      const part = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      
      if (!part) {
        throw new Error("Format respon dari AI tidak sesuai.");
      }

      // 3. Load generated image and set as background
      const aiImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      const imgElem = await loadImage(aiImageUrl);
      
      // Note: The AI might return the full image with the subject. 
      // To ensure high quality of the original subject, we use the AI image as the background,
      // and our masked high-res original subject will be composited on top of it automatically by our updateDisplay logic.
      setBgSettings({ type: 'image', value: 'ai-generated', imgElement: imgElem });
      setAiPrompt(''); // Clear prompt
      setActiveTool('background'); // Switch back to bg tool

    } catch (error) {
      console.error(error);
      setErrorMsg(`AI Edit Gagal: ${error.message}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };


  const handleDownload = () => {
    if (!displayCanvasRef.current) return;
    
    // Determine format based on background
    const isTransparent = bgSettings.type === 'transparent';
    const format = isTransparent ? 'image/png' : 'image/jpeg';
    const ext = isTransparent ? 'png' : 'jpg';
    const quality = isTransparent ? undefined : 0.92;

    // We can just grab the display canvas data URL
    const dataUrl = displayCanvasRef.current.toDataURL(format, quality);
    
    const link = document.createElement('a');
    link.download = `hapus-bg-hasil.${ext}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const ErrorToast = () => {
    if (!errorMsg) return null;
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg flex items-center max-w-md w-full mx-4">
        <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
        <p className="text-sm flex-1">{errorMsg}</p>
        <button onClick={() => setErrorMsg(null)} className="ml-3 hover:text-red-900"><X className="w-4 h-4" /></button>
      </div>
    );
  };

  const LoadingView = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-600 space-y-6">
      <div className="relative">
        <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-blue-800">{loadingProgress > 0 ? `${loadingProgress}%` : ''}</span>
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Memproses Foto...</h3>
        <p className="text-sm text-slate-500 max-w-sm animate-pulse">{loadingMsg}</p>
      </div>
    </div>
  );

  const APIKeyModal = () => {
    if (!showKeyModal) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-bold mb-2 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-purple-600"/> Setup AI Edit</h3>
          <p className="text-sm text-slate-600 mb-4">
            Untuk menggunakan fitur penggantian background generatif, masukkan API Key Gemini Anda. 
            Key hanya disimpan sementara di sesi browser ini.
          </p>
          <input 
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
          />
          <div className="flex justify-end space-x-3">
            <button onClick={() => setShowKeyModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Batal</button>
            <button onClick={() => setShowKeyModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Simpan & Lanjutkan</button>
          </div>
        </div>
      </div>
    );
  };

  const ToolPropertiesPanel = () => {
    switch (activeTool) {
      case 'background':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3 tracking-wider">Warna Dasar</h4>
              <div className="flex flex-wrap gap-3">
                {BG_COLORS.map(color => (
                  <button
                    key={color.name}
                    onClick={() => handleBgColorSelect(color.value)}
                    className={`w-10 h-10 rounded-full border-2 shadow-sm transition-transform hover:scale-110 flex items-center justify-center relative
                      ${bgSettings.value === color.value ? 'border-blue-500 scale-110 ring-2 ring-blue-200' : 'border-slate-200'}
                    `}
                    style={{ 
                      backgroundColor: color.value !== 'transparent' ? color.value : 'transparent',
                      backgroundImage: color.value === 'transparent' ? 'conic-gradient(#ccc 25%, white 25%, white 50%, #ccc 50%, #ccc 75%, white 75%)' : 'none',
                      backgroundSize: color.value === 'transparent' ? '10px 10px' : 'auto'
                    }}
                    title={color.name}
                  >
                     {bgSettings.value === color.value && color.value !== 'transparent' && <Check className={`w-5 h-5 ${color.value === '#ffffff' ? 'text-black' : 'text-white'}`} />}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3 tracking-wider">Latar Kustom</h4>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer transition text-sm text-slate-600">
                  <Upload className="w-5 h-5 mb-1 text-slate-400" />
                  <span>Upload Foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} />
                </label>
                <button onClick={applyBlurBg} className={`flex flex-col items-center justify-center p-3 border rounded-xl hover:bg-slate-50 transition text-sm
                  ${bgSettings.type === 'blur' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}
                `}>
                  <Droplet className="w-5 h-5 mb-1" />
                  <span>Blur Latar Asli</span>
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'erase':
      case 'restore':
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center">
                {activeTool === 'erase' ? <Eraser className="w-4 h-4 mr-2" /> : <PaintBrush className="w-4 h-4 mr-2" />}
                Mode: {activeTool === 'erase' ? 'Hapus Area' : 'Kembalikan Area'}
              </h4>
            </div>
            <div>
              <label className="text-xs text-slate-500 flex justify-between mb-2">
                <span>Ukuran Kuas</span>
                <span className="font-medium">{brushSettings.size}px</span>
              </label>
              <input 
                type="range" min="5" max="150" 
                value={brushSettings.size} 
                onChange={e => setBrushSettings({...brushSettings, size: parseInt(e.target.value)})}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 flex justify-between mb-2">
                <span>Kelembutan (Softness)</span>
                <span className="font-medium">{brushSettings.softness}%</span>
              </label>
              <input 
                type="range" min="0" max="100" 
                value={brushSettings.softness} 
                onChange={e => setBrushSettings({...brushSettings, softness: parseInt(e.target.value)})}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            <p className="text-xs text-slate-400 bg-slate-50 p-2 rounded">Tip: Usap pada gambar untuk {activeTool === 'erase' ? 'menghapus sisa latar' : 'mengembalikan bagian yang terhapus'}.</p>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-purple-100">
                <h4 className="text-sm font-bold text-purple-900 mb-2 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-purple-600"/> AI Background Generator
                </h4>
                <p className="text-xs text-purple-700 mb-4">Ganti latar belakang dengan mendeskripsikan suasana yang Anda inginkan. Subjek utama tidak akan berubah.</p>
                
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Contoh: Studio foto profesional dengan pencahayaan hangat, meja kayu."
                  className="w-full p-3 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none resize-none h-24 mb-3"
                />
                
                <button 
                  onClick={generateAIBg}
                  disabled={isGeneratingAI || !aiPrompt.trim()}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center"
                >
                  {isGeneratingAI ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {isGeneratingAI ? 'Membuat Latar...' : 'Generate Latar'}
                </button>
             </div>
             
             {!geminiKey && (
                <button onClick={() => setShowKeyModal(true)} className="text-xs text-slate-500 hover:text-blue-600 flex items-center w-full justify-center">
                  <Settings className="w-3 h-3 mr-1"/> Atur API Key
                </button>
             )}
          </div>
        );
      default: return null;
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      {ErrorToast()}
      {APIKeyModal()}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setAppState('home')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-inner">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              SmartBg
            </span>
          </div>
          
          {appState === 'editor' && (
            <div className="flex items-center space-x-2 sm:space-x-4">
               {/* Undo/Redo - Hidden on very small screens, visible on sm+ */}
               <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-1">
                 <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-slate-600 disabled:opacity-30 hover:bg-white rounded transition" title="Undo">
                   <Undo className="w-4 h-4" />
                 </button>
                 <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
                 <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-slate-600 disabled:opacity-30 hover:bg-white rounded transition" title="Redo">
                   <Redo className="w-4 h-4" />
                 </button>
               </div>

               <button 
                  onClick={handleDownload}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition transform hover:scale-105 active:scale-95"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* HOMEPAGE VIEW */}
        {appState === 'home' && (
          <div className="flex flex-col items-center justify-center mt-10 sm:mt-20 animate-in fade-in duration-500">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-center mb-4 tracking-tight">
              Hapus Background Foto
            </h1>
            <p className="text-slate-500 text-center max-w-lg mb-10 text-lg">
              Cepat dan otomatis. Penghapusan latar diproses di perangkat; model perlu diunduh saat pertama digunakan.
            </p>

            <div className="w-full max-w-xl">
              <label 
                className="relative flex flex-col items-center justify-center w-full h-72 border-2 border-slate-300 border-dashed rounded-2xl bg-white hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-50', 'border-blue-400'); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleProcessImage(e.dataTransfer.files[0]);
                  }
                }}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="mb-2 text-sm text-slate-600 font-semibold">
                    <span className="text-blue-600">Klik untuk upload</span> atau drag and drop
                  </p>
                  <p className="text-xs text-slate-400">JPG, PNG, WEBP didukung</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/jpeg, image/png, image/webp" 
                  onChange={(e) => handleProcessImage(e.target.files?.[0])}
                />
              </label>
            </div>
            
            <div className="mt-12 text-sm text-slate-400 flex items-center justify-center">
               <span className="flex items-center"><Check className="w-4 h-4 mr-1 text-green-500"/> Otomatis</span>
               <span className="mx-3">•</span>
               <span className="flex items-center"><Check className="w-4 h-4 mr-1 text-green-500"/> Presisi Tinggi</span>
               <span className="mx-3">•</span>
               <span className="flex items-center"><Check className="w-4 h-4 mr-1 text-green-500"/> Lokal setelah model tersedia</span>
            </div>
          </div>
        )}

        {/* PROCESSING VIEW */}
        {appState === 'processing' && LoadingView()}

        {/* EDITOR VIEW */}
        {appState === 'editor' && (
          <div className="flex flex-col lg:flex-row gap-6 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Canvas Container (Center) */}
            <div className="flex-1 flex flex-col min-h-[500px]">
              
              {/* Canvas Action Bar */}
              <div className="flex justify-between items-center mb-3">
                 <div className="flex space-x-2">
                    <button 
                      onPointerDown={() => setIsComparing(true)}
                      onPointerUp={() => setIsComparing(false)}
                      onPointerLeave={() => setIsComparing(false)}
                      className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 text-slate-700 flex items-center select-none active:bg-slate-100"
                    >
                      <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Tahan untuk Asli
                    </button>
                 </div>
                 {/* Mobile Undo/Redo */}
                 <div className="flex sm:hidden items-center bg-white border border-slate-200 rounded-md shadow-sm">
                   <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 text-slate-600 disabled:opacity-30 border-r border-slate-100"><Undo className="w-4 h-4" /></button>
                   <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 text-slate-600 disabled:opacity-30"><Redo className="w-4 h-4" /></button>
                 </div>
              </div>

              {/* The Interactive Canvas Area */}
              <div 
                ref={containerRef}
                className={`relative flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex items-center justify-center touch-none
                  ${(activeTool === 'erase' || activeTool === 'restore') ? 'cursor-crosshair' : 'cursor-default'}
                `}
                style={{
                   // Checkerboard pattern for transparent background visualization
                   backgroundImage: 'repeating-linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), repeating-linear-gradient(45deg, #f0f0f0 25%, #ffffff 25%, #ffffff 75%, #f0f0f0 75%, #f0f0f0)',
                   backgroundPosition: '0 0, 10px 10px',
                   backgroundSize: '20px 20px'
                }}
              >
                <canvas
                  ref={displayCanvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  className="max-w-full max-h-full object-contain pointer-events-auto"
                  style={{ touchAction: (activeTool === 'erase' || activeTool === 'restore') ? 'none' : 'auto' }} // Crucial for custom touch drawing
                />
              </div>
              <p className="text-center text-xs text-slate-400 mt-3">
                Resolusi kerja: {displayCanvasRef.current?.width || 0} x {displayCanvasRef.current?.height || 0}
              </p>
            </div>

            {/* Sidebar / Bottom Tools */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
              
              {/* Tool Selector */}
              <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-row lg:flex-col gap-2 overflow-x-auto hide-scrollbar">
                {[
                  { id: 'background', icon: <ImageIcon className="w-5 h-5"/>, label: 'Background' },
                  { id: 'erase', icon: <Eraser className="w-5 h-5"/>, label: 'Hapus' },
                  { id: 'restore', icon: <PaintBrush className="w-5 h-5"/>, label: 'Kembalikan' },
                  { id: 'ai', icon: <Sparkles className="w-5 h-5"/>, label: 'AI Edit' },
                ].map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`flex items-center justify-center lg:justify-start flex-1 lg:flex-none p-3 rounded-lg transition-colors whitespace-nowrap
                      ${activeTool === tool.id 
                        ? tool.id === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                      }
                    `}
                  >
                    <span className="mr-0 lg:mr-3">{tool.icon}</span>
                    <span className="text-sm font-medium hidden lg:inline">{tool.label}</span>
                  </button>
                ))}
              </div>

              {/* Tool Properties Panel */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex-1 min-h-[300px]">
                {ToolPropertiesPanel()}
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Global styles for hiding scrollbar in tool selector on mobile */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}