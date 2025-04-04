"use client";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";
import LoginForm from "./LoginForm";
import LivenessCheck from "./LivenessCheck";

const WebCamContainer = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureVideo, setCaptureVideo] = useState(false);
  const [detectInterval, setDetectInterval] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [faceRecognized, setFaceRecognized] = useState(false);
  const [showLivenessCheck, setShowLivenessCheck] = useState(false);
  const [livenessVerified, setLivenessVerified] = useState(false);

  const videoRef = useRef();
  const canvasRef = useRef();
  const videoHeight = 480;
  const videoWidth = 640;

  const recognizedStudents = new Map(); // Track temporary detections

  useEffect(() => {
    const initializeBackend = async () => {
      await tf.setBackend("webgl");
      await tf.ready();
      loadModels();
    };
    initializeBackend();

    return () => {
      if (detectInterval) clearInterval(detectInterval);
      closeWebcam();
    };
  }, []);

  const loadModels = async () => {
    const MODEL_URL = "/models";
    const modelConfigs = [
      { name: "tiny_face_detector", net: faceapi.nets.tinyFaceDetector },
      { name: "face_landmark_68", net: faceapi.nets.faceLandmark68Net },
      { name: "face_recognition", net: faceapi.nets.faceRecognitionNet },
      { name: "ssd_mobilenetv1", net: faceapi.nets.ssdMobilenetv1 },
    ];

    try {
      const modelPromises = modelConfigs.map(async ({ name, net }) => {
        try {
          console.log(`Loading ${name} from server`);
          await net.loadFromUri(MODEL_URL);
        } catch (err) {
          console.error(`Error loading ${name}:`, err);
          throw err;
        }
      });

      await Promise.all(modelPromises);
      setModelsLoaded(true);
      console.log("All models loaded successfully");
    } catch (error) {
      console.error("Error loading models:", error);
      // Set state to false if there's an error
      setModelsLoaded(false);
    }
  };

  const startVideo = async () => {
    setCaptureVideo(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: videoWidth, height: videoHeight },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const closeWebcam = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.pause();
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (detectInterval) clearInterval(detectInterval);
    setCaptureVideo(false);
  };

  const loadLabeledImages = async () => {
    if (
      !userData ||
      !userData.data ||
      !userData.data.foto_wajah ||
      userData.data.foto_wajah.length === 0
    ) {
      console.error("No face images available for recognition");
      return [];
    }

    try {
      const student = userData.data;
      const descriptions = [];

      // Use the images from the API response
      for (const fotoWajah of student.foto_wajah) {
        try {
          // Construct the full URL for the image
          const imageUrl = `http://localhost:1337${fotoWajah.url}`;
          console.log("Loading image from:", imageUrl);

          const img = await faceapi.fetchImage(imageUrl);
          const detection = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection) {
            descriptions.push(detection.descriptor);
            console.log("Face descriptor extracted successfully");
          }
        } catch (error) {
          console.warn(`Error loading image for ${student.nama}:`, error);
        }
      }

      // Create labeled face descriptors with the student's name
      const labeledDescriptor = new faceapi.LabeledFaceDescriptors(
        student.nama,
        descriptions
      );
      return [labeledDescriptor].filter((desc) => desc.descriptors.length > 0);
    } catch (error) {
      console.error("Error in loadLabeledImages:", error);
      return [];
    }
  };

  const handleVideoOnPlay = async () => {
    const labeledDescriptors = await loadLabeledImages();

    if (labeledDescriptors.length === 0) {
      console.error("No valid face descriptors loaded");
      return;
    }

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);

    if (detectInterval) clearInterval(detectInterval);

    const interval = setInterval(async () => {
      if (canvasRef.current && videoRef.current) {
        const displaySize = { width: videoWidth, height: videoHeight };
        faceapi.matchDimensions(canvasRef.current, displaySize);

        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 320,
              scoreThreshold: 0.5,
            })
          )
          .withFaceLandmarks()
          .withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, videoWidth, videoHeight);

        resizedDetections.forEach((detection) => {
          const match = faceMatcher.findBestMatch(detection.descriptor);
          const label = match.distance < 0.5 ? match.label : "unknown";
          const { box } = detection.detection;
          const drawBox = new faceapi.draw.DrawBox(box, { label });
          drawBox.draw(canvasRef.current);

          if (label !== "unknown") {
            recognizedStudents.set(
              label,
              (recognizedStudents.get(label) || 0) + 1
            );

            if (recognizedStudents.get(label) > 3) {
              if (!faceRecognized) {
                setFaceRecognized(true);
                setShowLivenessCheck(true);
              }
            }
          }
        });
      }
    }, 100);

    setDetectInterval(interval);
  };

  const addStudentToAttendance = (studentName) => {
    setStudents((prev) =>
      prev.includes(studentName) ? prev : [...prev, studentName]
    );
  };

  const handleLogin = (loginData) => {
    setUserData(loginData);
    setIsLoggedIn(true);
    setFaceRecognized(false);
  };

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col items-center py-8 space-y-8 w-full'>
      <h1 className='text-3xl font-bold mb-4'>Face Recognition Attendance</h1>
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
              setStudents([]);
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
