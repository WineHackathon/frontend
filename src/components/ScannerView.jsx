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
  X
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
          width: { ideal: 1920 },
          height: { ideal: 1080 }
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

  // Dismiss scan result card
  const handleDismissResult = (e) => {
    e.stopPropagation();
    setScanResult(null);
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
    <div className="relative w-full h-full min-h-[100dvh] flex flex-col justify-between overflow-hidden bg-black select-none">
      
      {/* Hidden file input for gallery upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* FULL-SCREEN LIVE CAMERA VIDEO FEED */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isCameraActive && !imagePreview ? 'opacity-100 z-0' : 'opacity-0 -z-10'
        }`}
      />

      {/* FULL-SCREEN FROZEN SNAPSHOT PREVIEW */}
      {imagePreview && (
        <img
          src={imagePreview}
          alt="Captured wine"
          className="absolute inset-0 w-full h-full object-cover z-0 animate-fadeIn"
        />
      )}

      {/* TOP VIGNETTE GRADIENT (Ensures header readability) */}
      <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none z-10" />

      {/* BOTTOM VIGNETTE GRADIENT (Ensures controls readability) */}
      <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10" />

      {/* CAMERA PERMISSION DENIED OR UNAVAILABLE FALLBACK SCREEN */}
      {!isCameraActive && !imagePreview && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c1a19] via-[#242220] to-[#1c1a19] flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 shadow-lg flex items-center justify-center text-white mb-4">
            <VideoOff className="w-8 h-8 text-[#f3c760]" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-white">
            {cameraStatus === 'denied' ? 'Доступ к камере заблокирован' : 'Камера не обнаружена'}
          </h3>
          <p className="text-xs text-[#d7d4d2] mt-1.5 max-w-[280px] leading-relaxed">
            {cameraStatus === 'denied'
              ? 'Разрешите доступ к камере в настройках браузера или выберите фотографию бутылки из галереи.'
              : 'Вы можете сделать снимок или загрузить фотографию этикетки из памяти устройства.'}
          </p>

          <div className="mt-5 flex flex-col space-y-2.5 w-full max-w-[220px]">
            <button
              onClick={handleTriggerUpload}
              className="svoe-btn-primary bg-[#8f3d42] hover:bg-[#ab494f] text-white text-xs font-semibold py-3 px-5 rounded-full flex items-center justify-center space-x-2 shadow-lg"
            >
              <Upload className="w-4 h-4" />
              <span>Выбрать из галереи</span>
            </button>
            <button
              onClick={() => startCameraStream(facingMode)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium py-2.5 px-4 rounded-full flex items-center justify-center space-x-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Повторить запрос</span>
            </button>
          </div>
        </div>
      )}

      {/* TOP UTILITY BAR (Under Floating Header) */}
      <div className="relative pt-20 sm:pt-22 px-4 sm:px-6 z-20 flex items-center justify-between pointer-events-auto w-full max-w-lg mx-auto">
        {/* Status Badge */}
        {isCameraActive && !imagePreview ? (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-medium border border-white/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Прямой эфир</span>
          </div>
        ) : imagePreview ? (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/20 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#f3c760]" />
            <span>Кадр зафиксирован</span>
          </div>
        ) : (
          <div />
        )}

        {/* Camera Actions (Flip Camera, Retake) */}
        <div className="flex items-center space-x-2">
          {isCameraActive && !imagePreview && (
            <button
              onClick={handleToggleFacingMode}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center border border-white/20 transition active:scale-95 shadow-sm"
              title="Переключить камеру (фронтальная / задняя)"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
          )}

          {imagePreview && (
            <button
              onClick={handleRetake}
              className="px-3 py-1.5 rounded-full bg-[#8f3d42] hover:bg-[#ab494f] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg transition active:scale-95"
              title="Сделать новый снимок"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#f3c760]" />
              <span>Переснять</span>
            </button>
          )}
        </div>
      </div>

      {/* CENTER TARGET RETICLE / VIEWFINDER */}
      <div className="relative flex-1 flex flex-col items-center justify-center pointer-events-none z-15 px-6 my-auto">
        <div className="relative w-[75vw] max-w-[280px] aspect-[3/4] max-h-[48vh] flex items-center justify-center">
          
          {/* Top-Left Bracket */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-[3.5px] border-l-[3.5px] border-white/90 rounded-tl-2xl shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
          {/* Top-Right Bracket */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-[3.5px] border-r-[3.5px] border-white/90 rounded-tr-2xl shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
          {/* Bottom-Left Bracket */}
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3.5px] border-l-[3.5px] border-white/90 rounded-bl-2xl shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
          {/* Bottom-Right Bracket */}
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3.5px] border-r-[3.5px] border-white/90 rounded-br-2xl shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>

          {/* AI Laser Sweep (Active during scanning) */}
          {isScanning && (
            <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-[#f3c760] to-transparent shadow-[0_0_24px_5px_rgba(243,199,96,0.9)] animate-laser-vino pointer-events-none" />
          )}

          {/* Wine Bottle Outline Guide */}
          {!imagePreview && (
            <div className="flex flex-col items-center opacity-70 transition duration-300">
              <svg
                viewBox="0 0 100 240"
                className="w-20 h-48 text-white drop-shadow-lg fill-none stroke-current stroke-[1.8]"
              >
                <rect x="42" y="10" width="16" height="15" rx="3" />
                <path d="M43 25 L43 75 Q43 90 28 105 L28 220 Q28 230 38 230 L62 230 Q72 230 72 220 L72 105 Q57 90 57 75 L57 25 Z" />
                <rect x="33" y="120" width="34" height="65" rx="2" strokeDasharray="3 3" />
              </svg>
              <div className="mt-3 text-white text-[11px] font-medium bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/15 shadow-md">
                Поместите этикетку в рамку
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM FLOATING CONTROLS & RESULTS OVERLAY */}
      <div className="relative z-20 w-full max-w-md mx-auto px-4 pb-6 sm:pb-8 flex flex-col items-center pointer-events-auto">
        
        {/* RECOGNITION RESULT BANNER */}
        {scanResult?.wine && (
          <div
            onClick={() => onSelectWine(scanResult.wine)}
            className="w-full mb-3 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#efdbc6] hover:border-[#8f3d42] cursor-pointer transition transform hover:-translate-y-0.5 shadow-2xl flex items-center justify-between animate-fadeIn relative group"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-[#f9f1f1] flex items-center justify-center text-[#8f3d42] border border-[#edd4d6] flex-shrink-0">
                <Wine className="w-6 h-6" />
              </div>
              <div className="text-left min-w-0 pr-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#8f3d42] block">
                  {scanResult.wine.category} • {scanResult.wine.sugar_type}
                </span>
                <h4 className="font-serif font-bold text-sm text-[#2c2a28] truncate">
                  {scanResult.wine.name}
                </h4>
                <p className="text-xs text-[#857e79] truncate">
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

            {/* Quick close button */}
            <button
              onClick={handleDismissResult}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#2c2a28] text-white flex items-center justify-center hover:bg-[#8f3d42] transition shadow-md"
              title="Закрыть"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ERROR NOTICE */}
        {scanError && (
          <div className="w-full mb-3 p-3 rounded-2xl bg-red-950/80 backdrop-blur-md border border-red-500/40 text-red-100 text-xs flex items-center space-x-2 animate-fadeIn shadow-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{scanError}</span>
          </div>
        )}

        {/* GUEST SCANS LIMIT NOTICE */}
        {!isAuth && remainingScans > 0 && remainingScans <= 3 && (
          <div className="mb-2.5 px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[#efdbc6] text-[11px] font-medium flex items-center space-x-1.5 shadow-sm">
            <AlertCircle className="w-3.5 h-3.5 text-[#f3c760]" />
            <span>Осталось {remainingScans} из 5 бесплатных сканирований</span>
          </div>
        )}

        {/* MAIN SHUTTER & CONTROLS ROW */}
        <div className="w-full flex items-center justify-around px-2 pt-1">
          
          {/* Gallery Upload Button */}
          <button
            onClick={handleTriggerUpload}
            className="w-14 h-14 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md flex flex-col items-center justify-center border border-white/25 transition active:scale-95 shadow-md group"
            title="Загрузить фото из галереи"
          >
            <Upload className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          </button>

          {/* Large Camera Shutter Ring Button */}
          <button
            onClick={handleSnapPhoto}
            disabled={isScanning}
            className="w-20 h-20 rounded-full border-[3.5px] border-white/90 p-1 flex items-center justify-center transition active:scale-90 hover:scale-105 shadow-2xl disabled:opacity-75 disabled:cursor-not-allowed"
            title={
              isScanning
                ? 'Распознаем этикетку...'
                : isCameraActive && !imagePreview
                ? 'Сделать снимок'
                : imagePreview
                ? 'Распознать повторно'
                : 'Сканировать'
            }
          >
            <div
              className={`w-full h-full rounded-full flex items-center justify-center transition ${
                isScanning
                  ? 'bg-[#8f3d42]/80'
                  : 'bg-white hover:bg-[#fefdfa]'
              }`}
            >
              {isScanning ? (
                <RefreshCw className="w-7 h-7 text-white animate-spin" />
              ) : isCameraActive && !imagePreview ? (
                <div className="w-14 h-14 rounded-full bg-[#8f3d42] flex items-center justify-center shadow-inner">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              ) : imagePreview ? (
                <div className="w-14 h-14 rounded-full bg-[#8f3d42] flex items-center justify-center shadow-inner">
                  <RefreshCw className="w-6 h-6 text-[#f3c760]" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#8f3d42] flex items-center justify-center shadow-inner">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          </button>

          {/* AI-Sommelier Floating Button */}
          <button
            onClick={onOpenSommelier}
            className="w-14 h-14 rounded-full bg-[#fdf9ed] hover:bg-white border-2 border-[#8f3d42] text-[#8f3d42] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition transform relative flex-shrink-0 animate-sommelier-pill"
            title="Открыть AI-Сомелье"
          >
            <Sparkles className="w-6 h-6 text-[#8f3d42]" />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#8f3d42] text-white text-[9px] font-bold shadow-sm">
              AI
            </span>
          </button>

        </div>

      </div>

    </div>
  );
}
