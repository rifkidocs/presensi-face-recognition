"use client";
import Image from "next/image";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { LoginForm } from "./login-form";
import LivenessCheck from "./LivenessCheck";
import { useFaceRecognition } from "../hooks/useFaceRecognition";
import { useWebcam } from "../hooks/useWebcam";
import { useLocation } from "../hooks/useLocation";
import * as faceapi from "face-api.js";
import { checkModelInIndexedDB, saveModelToIndexedDB } from "../lib/indexedDB";

const WebCamContainer = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showLivenessCheck, setShowLivenessCheck] = useState(false);
  const [livenessVerified, setLivenessVerified] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);
  const [livenessModelLoaded, setLivenessModelLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const {
    modelsLoaded,
    faceRecognized,
    startFaceDetection,
    setFaceRecognized,
    loadingPercentage: faceDetectionLoadingPercentage,
    faceDetectionProgress,
    isFaceDetecting,
  } = useFaceRecognition();

  const {
    captureVideo,
    videoRef,
    canvasRef,
    startVideo: startWebcam,
    closeWebcam,
    videoWidth,
    videoHeight,
    setCaptureVideo,
    cameraReady,
    loadingCamera,
    updateVideoDimensions
  } = useWebcam();

  const {
    locationData,
    locationError,
    isWithinRadius,
    loading: locationLoading,
    checkLocation,
    distance,
    maxRadius
  } = useLocation();

  const [userCoordinates, setUserCoordinates] = useState(null);

  // Calculate overall model loading progress
  useEffect(() => {
    const faceProgress = faceDetectionLoadingPercentage || 0;
    const livenessProgress = livenessModelLoaded ? 100 : 0;
    setLoadingProgress(Math.floor((faceProgress + livenessProgress) / 2));
  }, [faceDetectionLoadingPercentage, livenessModelLoaded]);

  // Preload liveness detection model when component mounts
  useEffect(() => {
    const preloadLivenessModel = async () => {
      try {
        // Check if liveness detection models are already in IndexedDB
        const modelsToPreload = ["tiny_face_detector", "face_landmark_68"];
        let allCached = true;
        
        for (const model of modelsToPreload) {
          const isCached = await checkModelInIndexedDB(model);
          if (!isCached) {
            allCached = false;
            break;
          }
        }
        
        // If all models are cached, set as loaded
        if (allCached) {
          console.log("All liveness detection models found in cache");
          setLivenessModelLoaded(true);
          return;
        }
        
        // Otherwise load the models silently in background
        console.log("Preloading liveness detection models...");
        
        // Load specific models required for liveness detection
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models")
        ]);
        
        // Save models to IndexedDB
        for (const model of modelsToPreload) {
          await saveModelToIndexedDB(model, true);
        }
        
        console.log("Liveness detection models preloaded successfully");
        setLivenessModelLoaded(true);
      } catch (error) {
        console.error("Error preloading liveness models:", error);
        // Even if there's an error, set as loaded after a timeout
        // to allow user to continue with the app
        setTimeout(() => setLivenessModelLoaded(true), 3000);
      }
    };
    
    preloadLivenessModel();
  }, []);

  // Check location when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      checkLocation();
      setLocationChecked(true);
    }
  }, [isLoggedIn, checkLocation]);

  // Start webcam only when all models are loaded and user is logged in
  useEffect(() => {
    const allModelsLoaded = modelsLoaded && livenessModelLoaded;
    if (allModelsLoaded && isLoggedIn && !faceRecognized && !captureVideo) {
      startWebcam();
    }
  }, [modelsLoaded, livenessModelLoaded, isLoggedIn, faceRecognized, captureVideo, startWebcam]);

  const handleVideoOnPlay = useCallback(async () => {
    // Re-check location before starting face detection
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      setUserCoordinates({ latitude, longitude });
      await checkLocation();

      if (!isWithinRadius) {
        closeWebcam();
        return;
      }

      await startFaceDetection({
        videoRef,
        canvasRef,
        userData,
        onFaceRecognized: () => {
          setShowLivenessCheck(true);
          closeWebcam();
        },
        videoWidth,
        videoHeight,
      });
    } catch (error) {
      console.error("Error getting location:", error);
      closeWebcam();
    }
  }, [videoRef, canvasRef, userData, isWithinRadius, closeWebcam, startFaceDetection, checkLocation, videoWidth, videoHeight]);

  const handleCloseWebcam = useCallback(() => {
    closeWebcam();
    setShowLivenessCheck(false);
    setLivenessVerified(false);
  }, [closeWebcam]);

  const handleLogin = useCallback((loginData) => {
    setUserData(loginData);
    setIsLoggedIn(true);
    setFaceRecognized(false);
  }, []);

  const allModelsLoaded = useMemo(() => {
    return modelsLoaded && livenessModelLoaded;
  }, [modelsLoaded, livenessModelLoaded]);

  const getCurrentLocation = useCallback(async () => {
    // Prevent multiple clicks while loading
    if (locationLoading) {
      return;
    }
    
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      });

      const { latitude, longitude } = position.coords;
      setUserCoordinates({ latitude, longitude });
      await checkLocation();
    } catch (error) {
      console.error("Error getting location:", error);
    }
  }, [checkLocation, locationLoading]);

  const handleStartFaceRecognition = useCallback(async () => {
    // Prevent multiple clicks
    if (locationLoading || !allModelsLoaded || !isWithinRadius) {
      return;
    }
    
    try {
      await getCurrentLocation();
      if (isWithinRadius) {
        setShowLivenessCheck(false);
        setLivenessVerified(false);
        setFaceRecognized(false);
        startWebcam();
      }
    } catch (error) {
      console.error("Error starting face recognition:", error);
    }
  }, [getCurrentLocation, isWithinRadius, startWebcam, locationLoading, allModelsLoaded]);

  useEffect(() => {
    if (captureVideo && videoRef.current && canvasRef.current) {
      // Handler for when video dimensions change or when the video plays
      const updateCanvasDimensions = () => {
        if (videoRef.current && canvasRef.current) {
          const videoRect = videoRef.current.getBoundingClientRect();
          canvasRef.current.width = videoRect.width;
          canvasRef.current.height = videoRect.height;
        }
      };

      // Set initial dimensions
      updateCanvasDimensions();

      // Listen for resize events on window
      window.addEventListener('resize', updateCanvasDimensions);
      
      // Listen for video playing/loaded events
      videoRef.current.addEventListener('play', updateCanvasDimensions);
      videoRef.current.addEventListener('loadedmetadata', updateCanvasDimensions);

      return () => {
        window.removeEventListener('resize', updateCanvasDimensions);
        if (videoRef.current) {
          videoRef.current.removeEventListener('play', updateCanvasDimensions);
          videoRef.current.removeEventListener('loadedmetadata', updateCanvasDimensions);
        }
      };
    }
  }, [captureVideo, videoRef, canvasRef]);

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center py-8 space-y-8 w-full'>
      {!isLoggedIn ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <div className='w-full max-w-4xl flex flex-col items-center space-y-8'>
          {/* User Information Card */}
          <div className='bg-gray-800 p-6 rounded-xl w-full max-w-md'>
            <h2 className='text-xl font-semibold mb-4'>
              {userData.role === "siswa"
                ? `Selamat datang, ${userData.data.nama}`
                : `Selamat datang, ${userData.role}`}
            </h2>

            {userData.role === "siswa" && userData.data && (
              <div className='flex items-center space-x-4 mb-4'>
                {userData.data.foto_wajah &&
                  userData.data.foto_wajah.length > 0 && (
                    <div className='flex-shrink-0'>
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}${userData.data.foto_wajah[0].formats.thumbnail.url}`}
                        width={80}
                        height={80}
                        alt={userData.data.nama}
                        className='rounded-lg'
                      />
                    </div>
                  )}
                <div>
                  <p className='text-gray-300'>
                    Nomor Induk: {userData.data.nomor_induk_siswa}
                  </p>
                </div>
              </div>
            )}

            {locationError && (
              <div className='bg-red-500 text-white p-3 rounded-lg mb-4'>
                {locationError}
              </div>
            )}

            {locationChecked && !locationError && (
              <div
                className={`p-3 rounded-lg mb-4 ${
                  isWithinRadius ? "bg-green-500" : "bg-yellow-500"
                } text-white`}>
                <p className='mb-2'>
                  {isWithinRadius
                    ? "Anda berada dalam area presensi."
                    : "Anda berada di luar area presensi. Silakan pindah ke lokasi yang ditentukan."}
                </p>
                {userCoordinates && distance !== null && (
                  <div className='text-sm'>
                    <p>
                      Koordinat Anda: {userCoordinates.latitude.toFixed(6)},{" "}
                      {userCoordinates.longitude.toFixed(6)}
                    </p>
                    {locationData && (
                      <p>
                        Koordinat Sekolah: {locationData.latitude},{" "}
                        {locationData.longitude}
                      </p>
                    )}
                    <div className="flex items-center mt-2">
                      <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isWithinRadius ? 'bg-green-700' : 'bg-red-600'}`}
                          style={{ width: `${Math.min(100, (distance / (maxRadius || 100)) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 font-bold">
                        {distance ? `${distance.toFixed(0)}m` : "?"}
                      </span>
                    </div>
                    <p className="text-xs mt-1">
                      Jarak dengan lokasi: <strong>{distance ? `${distance.toFixed(0)} meter` : "-"}</strong> 
                      (Radius maksimal: <strong>{maxRadius} meter</strong>)
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <button
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className={`bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-xl transition ${
                    locationLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}>
                  {locationLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memuat...
                    </span>
                  ) : "Reload Lokasi"}
                </button>

                <span
                  className={`px-3 py-1 rounded-lg ${
                    isWithinRadius ? "bg-green-500" : "bg-red-500"
                  }`}>
                  {isWithinRadius ? "Lokasi Valid" : "Lokasi Tidak Valid"}
                </span>
              </div>

              {!allModelsLoaded && (
                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-4 mb-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-4 rounded-full transition-all duration-300 relative"
                      style={{ width: `${loadingProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                        {loadingProgress}%
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-300 animate-pulse">
                    {loadingProgress < 25 ? "Menyiapkan model pengenalan wajah..." : 
                     loadingProgress < 50 ? "Memuat model deteksi wajah..." : 
                     loadingProgress < 75 ? "Memuat model face landmark..." : 
                     loadingProgress < 100 ? "Hampir selesai..." : 
                     "Model siap digunakan!"}
                  </p>
                </div>
              )}

              <div>
                {!captureVideo ? (
                  <button
                    onClick={handleStartFaceRecognition}
                    disabled={!allModelsLoaded || !isWithinRadius}
                    className={`text-white px-4 py-2 rounded-xl transition w-full ${
                      isWithinRadius && allModelsLoaded
                        ? "bg-green-500 hover:bg-green-400"
                        : "bg-gray-500 cursor-not-allowed"
                    }`}>
                    {allModelsLoaded 
                      ? "Mulai Pengenalan Wajah" 
                      : "Menunggu model selesai dimuat..."}
                  </button>
                ) : (
                  <button
                    onClick={handleCloseWebcam}
                    className='bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-xl transition w-full'>
                    Hentikan Kamera
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Webcam and Liveness Container - Below User Card */}
          <div className="w-full max-w-md flex flex-col items-center space-y-6">
            {captureVideo && (
              <div className='relative border-4 border-gray-700 rounded-lg overflow-hidden'>
                {loadingCamera && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10">
                    <div className="text-center p-4">
                      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-white">Memulai kamera...</p>
                    </div>
                  </div>
                )}
                
                <video
                  ref={videoRef}
                  width={videoWidth}
                  height={videoHeight}
                  onPlay={handleVideoOnPlay}
                  className='rounded-lg w-full h-auto'
                  playsInline
                  muted
                  autoPlay
                  onLoadedMetadata={updateVideoDimensions}
                />
                
                <canvas
                  ref={canvasRef}
                  className='absolute top-0 left-0 w-full h-full'
                  style={{ pointerEvents: 'none' }}
                />
                
                {isFaceDetecting && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm">Verifikasi Wajah:</span>
                      <span className="text-white text-sm font-bold">{Math.round(faceDetectionProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${faceDetectionProgress}%` }}
                      >
                        {faceDetectionProgress > 0 && (
                          <div className="h-full w-2 bg-white absolute right-0 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 mt-1 text-center">
                      {faceDetectionProgress < 30 ? "Tahan wajah anda tepat di depan kamera..." : 
                       faceDetectionProgress < 60 ? "Sedang memverifikasi identitas..." : 
                       faceDetectionProgress < 90 ? "Hampir selesai..." : 
                       "Verifikasi berhasil!"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {showLivenessCheck && (
              <LivenessCheck
                userData={userData}
                onVerificationComplete={(success) => {
                  setLivenessVerified(success);
                  if (success) {
                    setTimeout(() => {
                      closeWebcam();
                    }, 1500);
                  }
                }}
              />
            )}
          </div>

          <button
            onClick={() => {
              setIsLoggedIn(false);
              setUserData(null);
              setFaceRecognized(false);
              closeWebcam();
            }}
            className='mt-8 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl transition'>
            Keluar
          </button>
        </div>
      )}
    </div>
  );
};

export default WebCamContainer;
