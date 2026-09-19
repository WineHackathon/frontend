import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Wine,
  FlipHorizontal,
  Upload,
  VideoOff,
  Eye
} from 'lucide-react';
import { api } from '../services/api';

export default function ScannerView({
  remainingScans,
  onScanComplete,
  onOpenSommelier,
  onOpenAuth,
  onSelectWine,
  isAuth
}) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('initializing'); // 'initializing' | 'granted' | 'denied' | 'unavailable'
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [capturedImage, setCapturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop current active media stream
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Initialize and start live camera video feed
  const startCameraStream = useCallback(async (mode = facingMode) => {
    setScanError(null);
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unavailable');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play().catch(() => {});
      }

      setIsCameraActive(true);
      setCameraStatus('granted');
    } catch (err) {
      console.warn('Camera stream error:', err);
      // Fallback: try without facingMode constraints
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
        setCameraStatus('granted');
      } catch (fallbackErr) {
        console.error('All camera attempts failed:', fallbackErr);
        if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
          setCameraStatus('denied');
        } else {
          setCameraStatus('unavailable');
        }
        setIsCameraActive(false);
      }
    }
  }, [facingMode, stopCameraStream]);

  // Start camera on mount, stop on unmount
  useEffect(() => {
    startCameraStream(facingMode);
    return () => {
      stopCameraStream();
    };
  }, []);

  // Flip front / rear camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCameraStream(nextMode);
  };

  // Capture current video frame onto canvas
  const captureFrameFromVideo = () => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const file = new File([blob], `wine-snap-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve({ file, previewUrl });
      }, 'image/jpeg', 0.92);
    });
  };

  // Perform AI Recognition Scan
  const executeScan = async (fileToScan) => {
    setIsScanning(true);
    setScanError(null);

    try {
      const result = await api.scanLabel(fileToScan);

      if (result.registration_required) {
        onOpenAuth({
          title: 'Лимит бесплатных сканирований',
          subtitle: 'Вы использовали все 5 бесплатных распознаваний. Зарегистрируйтесь для безлимитного поиска и сохранения вин в погреб!'
        });
        setIsScanning(false);
        return;
      }

      setScanResult(result);
      if (result.wine) {
        api.recordLocalScan(result.wine);
      }
      onScanComplete(result.remaining_scans);
    } catch (err) {
      console.error('Scan error:', err);
      setScanError('Не удалось распознать этикетку. Попробуйте сфокусироваться четче или при лучшем освещении.');
    } finally {
      setIsScanning(false);
    }
  };

  // Shutter action: take live picture & start scanning
  const handleSnapPhoto = async () => {
    if (isCameraActive && videoRef.current) {
      const snap = await captureFrameFromVideo();
      if (snap) {
        setCapturedImage(snap.file);
        setImagePreview(snap.previewUrl);
        // Pause live camera to freeze preview
        stopCameraStream();
        await executeScan(snap.file);
        return;
      }
    }

    // If image already captured or loaded from file
    if (capturedImage) {
      await executeScan(capturedImage);
    } else {
      // Trigger file upload fallback
      handleTriggerUpload();
    }
  };

  // Retake photo: clear snapshot & resume live camera
  const handleRetake = () => {
    setCapturedImage(null);
    setImagePreview(null);
    setScanResult(null);
    setScanError(null);
    startCameraStream(facingMode);
  };

  // Handle file picker upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    stopCameraStream();
    setCapturedImage(file);
    setScanResult(null);
    setScanError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);

    // Auto-run scan on upload
    executeScan(file);
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-5rem)] max-w-md mx-auto px-4 py-3 relative">
      
      {/* Hidden file input for gallery upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Title & Instructions (Scheme 1: "СВОЕ ВИНО") */}
      <div className="w-full text-center mb-2">
        <h1 className="font-serif font-medium text-2xl sm:text-3xl text-[#2c2a28] tracking-tight">
          Своё Вино
        </h1>
        <p className="text-xs text-[#857e79] mt-0.5 font-normal">
          {isCameraActive
            ? 'Поместите бутылку в видоискатель и сделайте снимок'
            : 'Наведите камеру на бутылку или загрузите фото этикетки'}
        </p>

        {/* Scan Limit Reminder */}
        {!isAuth && remainingScans <= 3 && remainingScans > 0 && (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#fdf9ed] border border-[#efdbc6] text-[#8f3d42] text-xs mt-2 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-[#8f3d42]" />
            <span>Осталось {remainingScans} из 5 бесплатных сканирований</span>
          </div>
        )}
      </div>

      {/* MAIN VIEWFINDER AREA (Aspect 9/14 matching Wireframe 1) */}
      <div className="w-full aspect-[9/14] max-h-[490px] rounded-[32px] bg-[#2c2a28] border border-[#efdbc6] relative flex flex-col items-center justify-center overflow-hidden shadow-svoe-elevated">
        
        {/* LIVE CAMERA VIDEO FEED */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isCameraActive && !imagePreview ? 'opacity-100 z-0' : 'opacity-0 -z-10'
          }`}
        />

        {/* FROZEN SNAPSHOT PREVIEW */}
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Captured wine"
            className="absolute inset-0 w-full h-full object-cover z-10 animate-fadeIn"
          />
        )}

        {/* CAMERA PERMISSION DENIED OR UNAVAILABLE FALLBACK SCREEN */}
        {!isCameraActive && !imagePreview && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#fefdfa] via-[#fdf9ed] to-[#fdf9ed] flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-16 h-16 rounded-full bg-white border border-[#efdbc6] shadow-sm flex items-center justify-center text-[#8f3d42] mb-3">
              <VideoOff className="w-8 h-8 text-[#8f3d42]" />
            </div>
            <h3 className="font-serif text-base font-semibold text-[#2c2a28]">
              {cameraStatus === 'denied' ? 'Доступ к камере заблокирован' : 'Камера не обнаружена'}
            </h3>
            <p className="text-xs text-[#857e79] mt-1 max-w-[240px] leading-relaxed">
              {cameraStatus === 'denied'
                ? 'Разрешите доступ к камере в настройках браузера или загрузите фото этикетки из галереи.'
                : 'Вы можете загрузить фотографию бутылки или этикетки из памяти устройства.'}
            </p>

            <div className="mt-4 flex flex-col space-y-2 w-full max-w-[200px]">
              <button
                onClick={handleTriggerUpload}
                className="svoe-btn-primary bg-[#8f3d42] hover:bg-[#ab494f] text-white text-xs font-medium py-2.5 px-4 rounded-full flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Загрузить фото</span>
              </button>
              {cameraStatus === 'denied' && (
                <button
                  onClick={() => startCameraStream(facingMode)}
                  className="svoe-btn-secondary bg-[#fdf9ed] border border-[#efdbc6] text-[#8f3d42] text-xs font-medium py-2 px-4 rounded-full flex items-center justify-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Повторить запрос</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TOP CONTROLS ON VIEWFINDER */}
        <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-auto">
          {/* Live Status Badge */}
          {isCameraActive && !imagePreview ? (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#2c2a28]/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Прямой эфир</span>
            </div>
          ) : imagePreview ? (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#2c2a28]/70 backdrop-blur-md text-white text-[11px] font-medium border border-white/20">
              <CheckCircle2 className="w-3 h-3 text-[#f3c760]" />
              <span>Кадр зафиксирован</span>
            </div>
          ) : (
            <div></div>
          )}

          {/* Quick Actions (Flip Camera, Upload from Gallery, Retake) */}
          <div className="flex items-center space-x-2">
            {isCameraActive && !imagePreview && (
              <button
                onClick={handleToggleFacingMode}
                className="w-9 h-9 rounded-full bg-[#2c2a28]/60 hover:bg-[#2c2a28]/80 text-white backdrop-blur-md flex items-center justify-center border border-white/20 transition active:scale-95"
                title="Переключить камеру"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleTriggerUpload}
              className="w-9 h-9 rounded-full bg-[#2c2a28]/60 hover:bg-[#2c2a28]/80 text-white backdrop-blur-md flex items-center justify-center border border-white/20 transition active:scale-95"
              title="Загрузить фото из файла"
            >
              <Upload className="w-4 h-4" />
            </button>

            {imagePreview && (
              <button
                onClick={handleRetake}
                className="px-3 py-1.5 rounded-full bg-[#8f3d42] hover:bg-[#ab494f] text-white text-xs font-medium flex items-center space-x-1 shadow-md transition active:scale-95"
                title="Сделать новый снимок"
              >
                <RefreshCw className="w-3 h-3 text-[#f3c760]" />
                <span>Переснять</span>
              </button>
            )}
          </div>
        </div>

        {/* SCANNING LASER SWEEP (Active during AI recognition) */}
        {isScanning && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8f3d42] to-transparent shadow-[0_0_20px_4px_rgba(143,61,66,0.8)] z-30 animate-laser-vino pointer-events-none"></div>
        )}

        {/* TARGET CORNER BRACKETS [   ] (Matching Wireframe 1 exactly) */}
        <div className="relative w-64 h-80 z-20 flex items-center justify-center pointer-events-none">
          {/* Top-Left Bracket */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-[3.5px] border-l-[3.5px] border-[#8f3d42] rounded-tl-xl shadow-sm"></div>
          {/* Top-Right Bracket */}
          <div className="absolute top-0 right-0 w-10 h-10 border-t-[3.5px] border-r-[3.5px] border-[#8f3d42] rounded-tr-xl shadow-sm"></div>
          {/* Bottom-Left Bracket */}
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3.5px] border-l-[3.5px] border-[#8f3d42] rounded-bl-xl shadow-sm"></div>
          {/* Bottom-Right Bracket */}
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3.5px] border-r-[3.5px] border-[#8f3d42] rounded-br-xl shadow-sm"></div>

          {/* Wine Bottle Outline Guide in center */}
          {!imagePreview && (
            <div className="flex flex-col items-center opacity-40 transition duration-300">
              <svg
                viewBox="0 0 100 240"
                className="w-24 h-56 text-white drop-shadow-md fill-none stroke-current stroke-[1.8]"
              >
                <rect x="42" y="10" width="16" height="15" rx="3" />
                <path d="M43 25 L43 75 Q43 90 28 105 L28 220 Q28 230 38 230 L62 230 Q72 230 72 220 L72 105 Q57 90 57 75 L57 25 Z" />
                <rect x="33" y="120" width="34" height="65" rx="2" strokeDasharray="3 3" />
              </svg>
              <div className="mt-2 text-white text-[11px] font-medium bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                Поместите этикетку в рамку
              </div>
            </div>
          )}
        </div>

      </div>

      {/* RECOGNITION RESULT BANNER (Scheme 1 bottom card) */}
      {scanResult?.wine && (
        <div
          onClick={() => onSelectWine(scanResult.wine)}
          className="w-full mt-3 p-3.5 rounded-2xl bg-white border border-[#efdbc6] hover:border-[#8f3d42] cursor-pointer transition transform hover:-translate-y-0.5 shadow-svoe-card flex items-center justify-between animate-fadeIn"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-[#f9f1f1] flex items-center justify-center text-[#8f3d42] border border-[#edd4d6] flex-shrink-0">
              <Wine className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8f3d42]">
                {scanResult.wine.category} • {scanResult.wine.sugar_type}
              </span>
              <h4 className="font-serif font-bold text-sm text-[#2c2a28] line-clamp-1">
                {scanResult.wine.name}
              </h4>
              <p className="text-xs text-[#857e79] line-clamp-1">
                {scanResult.wine.winery} ({scanResult.wine.region})
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 pl-2 flex-shrink-0">
            <div className="text-right">
              <span className="text-[9px] text-[#857e79] block uppercase font-semibold">Роскачество</span>
              <span className="font-serif font-bold text-sm text-[#dfa838]">
                {scanResult.wine.roskachestvo_score || '86.0'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#857e79]" />
          </div>
        </div>
      )}

      {/* ERROR NOTICE */}
      {scanError && (
        <div className="w-full mt-2 p-3 rounded-2xl bg-[#fdf6f6] border border-[#edd4d6] text-[#723135] text-xs flex items-center space-x-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#8f3d42]" />
          <span>{scanError}</span>
        </div>
      )}

      {/* BOTTOM CONTROLS (Wireframe 1 exact arrangement) */}
      <div className="w-full pt-4 pb-2 flex items-center justify-between space-x-4 relative">
        
        {/* Main Action Button ("Сканировать" / "Сфотографировать") */}
        <button
          onClick={handleSnapPhoto}
          disabled={isScanning}
          className="flex-1 svoe-btn-primary bg-[#8f3d42] hover:bg-[#ab494f] active:bg-[#723135] text-white font-medium py-3.5 px-6 rounded-full transition shadow-svoe-pill flex items-center justify-center space-x-2.5 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span className="text-sm font-semibold">Анализируем этикетку...</span>
            </>
          ) : isCameraActive && !imagePreview ? (
            <>
              <Camera className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold tracking-wide">Сделать снимок</span>
            </>
          ) : imagePreview ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#f3c760]" />
              <span className="text-sm font-semibold tracking-wide">Распознать повторно</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold tracking-wide">Сканировать</span>
            </>
          )}
        </button>

        {/* Floating Action Button: AI-Sommelier Icon (Scheme 1) */}
        <button
          onClick={onOpenSommelier}
          className="w-14 h-14 rounded-full bg-[#fdf9ed] hover:bg-[#f8ecc9] border-2 border-[#8f3d42] text-[#8f3d42] flex items-center justify-center shadow-svoe-pill hover:scale-105 active:scale-95 transition transform relative flex-shrink-0 animate-sommelier-pill"
          title="Открыть Цифрового Сомелье"
        >
          <Sparkles className="w-6 h-6 text-[#8f3d42]" />
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#8f3d42] text-white text-[9px] font-bold shadow-sm">
            AI
          </span>
        </button>

      </div>

    </div>
  );
}
