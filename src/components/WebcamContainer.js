"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { LoginForm } from "./login-form";
import LivenessCheck from "./LivenessCheck";
import { useFaceRecognition } from "../hooks/useFaceRecognition";
import { useWebcam } from "../hooks/useWebcam";
import { useLocation } from "../hooks/useLocation";

const WebCamContainer = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showLivenessCheck, setShowLivenessCheck] = useState(false);
  const [livenessVerified, setLivenessVerified] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);

  const {
    modelsLoaded,
    faceRecognized,
    startFaceDetection,
    setFaceRecognized,
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
  } = useWebcam();

  const {
    locationData,
    locationError,
    isWithinRadius,
    loading: locationLoading,
    checkLocation,
  } = useLocation();

  const [userCoordinates, setUserCoordinates] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      checkLocation();
      setLocationChecked(true);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (modelsLoaded && isLoggedIn && !faceRecognized) {
      startWebcam();
    }
  }, [modelsLoaded, isLoggedIn, faceRecognized]);

  const handleVideoOnPlay = async () => {
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
  };

  const handleCloseWebcam = () => {
    closeWebcam();
    setShowLivenessCheck(false);
    setLivenessVerified(false);
  };

  const handleLogin = (loginData) => {
    setUserData(loginData);
    setIsLoggedIn(true);
    setFaceRecognized(false);
  };

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center py-8 space-y-8 w-full'>
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

      {!isLoggedIn ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <div className='w-full max-w-4xl flex flex-col items-center space-y-8'>
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
                        src={`http://localhost:1337${userData.data.foto_wajah[0].formats.thumbnail.url}`}
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
                {userCoordinates && (
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
                  </div>
                )}
              </div>
            )}

            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <button
                  onClick={async () => {
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
                  }}
                  className='bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-xl transition'>
                  {locationLoading ? "Memuat..." : "Reload Lokasi"}
                </button>

                <span
                  className={`px-3 py-1 rounded-lg ${
                    isWithinRadius ? "bg-green-500" : "bg-red-500"
                  }`}>
                  {isWithinRadius ? "Lokasi Valid" : "Lokasi Tidak Valid"}
                </span>
              </div>

              <div>
                {!captureVideo ? (
                  <button
                    onClick={async () => {
                      try {
                        const position = await new Promise(
                          (resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(
                              resolve,
                              reject,
                              {
                                enableHighAccuracy: true,
                                timeout: 5000,
                                maximumAge: 0,
                              }
                            );
                          }
                        );

                        const { latitude, longitude } = position.coords;
                        setUserCoordinates({ latitude, longitude });

                        await checkLocation();
                        if (isWithinRadius) {
                          setShowLivenessCheck(false);
                          setLivenessVerified(false);
                          setFaceRecognized(false);
                          startWebcam();
                        }
                      } catch (error) {
                        console.error("Error getting location:", error);
                      }
                    }}
                    disabled={!modelsLoaded || !isWithinRadius}
                    className={`text-white px-4 py-2 rounded-xl transition w-full ${
                      isWithinRadius
                        ? "bg-green-500 hover:bg-green-400"
                        : "bg-gray-500 cursor-not-allowed"
                    }`}>
                    Mulai Pengenalan Wajah
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

          {captureVideo && (
            <div className='relative border-4 border-gray-700 rounded-lg overflow-hidden'>
              <video
                ref={videoRef}
                width={videoWidth}
                height={videoHeight}
                onPlay={handleVideoOnPlay}
                className='rounded-lg'
              />
              <canvas
                ref={canvasRef}
                className='absolute top-0 left-0'
                width={videoWidth}
                height={videoHeight}
              />
            </div>
          )}

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
