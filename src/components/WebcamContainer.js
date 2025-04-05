"use client";
import Image from "next/image";
import React, { useState } from "react";
import LoginForm from "./LoginForm";
import LivenessCheck from "./LivenessCheck";
import { useFaceRecognition } from "../hooks/useFaceRecognition";
import { useWebcam } from "../hooks/useWebcam";

const WebCamContainer = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showLivenessCheck, setShowLivenessCheck] = useState(false);
  const [livenessVerified, setLivenessVerified] = useState(false);

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
    startVideo,
    closeWebcam,
    videoWidth,
    videoHeight,
  } = useWebcam();

  const handleVideoOnPlay = async () => {
    await startFaceDetection({
      videoRef,
      canvasRef,
      userData,
      onFaceRecognized: () => setShowLivenessCheck(true),
      videoWidth,
      videoHeight,
    });
  };

  const handleLogin = (loginData) => {
    setUserData(loginData);
    setIsLoggedIn(true);
    setFaceRecognized(false);
  };

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center py-8 space-y-8 w-full'>
      <h1 className='text-3xl font-bold mb-4'>
        Sistem Presensi MTSS AR-ROUDLOH
      </h1>
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

            <div className='space-x-4'>
              {!captureVideo ? (
                <button
                  onClick={startVideo}
                  disabled={!modelsLoaded}
                  className='bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-xl transition w-full'>
                  Mulai Pengenalan Wajah
                </button>
              ) : (
                <button
                  onClick={closeWebcam}
                  className='bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-xl transition w-full'>
                  Hentikan Kamera
                </button>
              )}
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
