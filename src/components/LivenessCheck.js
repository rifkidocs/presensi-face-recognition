"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import * as faceapi from "face-api.js";

const LivenessCheck = ({ onVerificationComplete }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(null);
  const [completedInstructions, setCompletedInstructions] = useState([]);
  const [isLivenessVerified, setIsLivenessVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flashing, setFlashing] = useState(false);

  // Movement thresholds
  const nodThreshold = 10;
  const mouthOpenThreshold = 30;
  const headTurnThreshold = 15; // Threshold untuk deteksi gerakan kepala ke samping

  // Refs for flags and counters
  const openMouthDone = useRef(false);
  const headTurnDone = useRef(false);
  const nodDone = useRef(false);
  const initialNoseX = useRef(null);
  const initialNoseY = useRef(null);
  const maxNoseX = useRef(null);
  const minNoseX = useRef(null);

  const instructions = [
    "Silakan buka mulut Anda lebar-lebar.",
    "Silakan gerakkan kepala Anda ke kiri dan kanan.",
    "Silakan anggukkan kepala Anda.",
  ];

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");

      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error("Error accessing webcam:", err));
    } catch (error) {
      console.error("Error loading models:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const pickRandomInstruction = useCallback(() => {
    const availableInstructions = instructions.filter(
      (_, index) => !completedInstructions.includes(index)
    );

    if (availableInstructions.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * availableInstructions.length
      );
      const chosenInstructionIndex = instructions.indexOf(
        availableInstructions[randomIndex]
      );
      setCurrentInstructionIndex(chosenInstructionIndex);
    } else {
      setIsLivenessVerified(true);
      // Hentikan stream kamera setelah verifikasi selesai
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      onVerificationComplete(true);
    }
  }, [completedInstructions, onVerificationComplete]);

  const detectFace = useCallback(async () => {
    if (
      videoRef.current &&
      canvasRef.current &&
      currentInstructionIndex !== null
    ) {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detections.length > 0) {
        const landmarks = detections[0].landmarks;
        const canvasCtx = canvasRef.current.getContext("2d");

        const dims = faceapi.matchDimensions(
          canvasRef.current,
          videoRef.current,
          true
        );
        const resizedDetections = faceapi.resizeResults(detections, dims);
        canvasCtx.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

        switch (currentInstructionIndex) {
          case 0:
            // Mouth open detection
            const mouthTop = landmarks.positions[62];
            const mouthBottom = landmarks.positions[66];
            const mouthDistance = mouthBottom.y - mouthTop.y;

            if (mouthDistance > mouthOpenThreshold && !openMouthDone.current) {
              openMouthDone.current = true;
              setCompletedInstructions([...completedInstructions, 0]);
              setCurrentInstructionIndex(null);
            }
            break;

          case 1:
            // Head turn detection
            const nose = landmarks.positions[30];
            const leftEye = landmarks.positions[36];
            const rightEye = landmarks.positions[45];

            if (initialNoseX.current === null) {
              initialNoseX.current = nose.x;
              maxNoseX.current = nose.x;
              minNoseX.current = nose.x;
            } else {
              maxNoseX.current = Math.max(maxNoseX.current, nose.x);
              minNoseX.current = Math.min(minNoseX.current, nose.x);

              const horizontalMovement = maxNoseX.current - minNoseX.current;

              if (
                horizontalMovement > headTurnThreshold &&
                !headTurnDone.current
              ) {
                headTurnDone.current = true;
                setCompletedInstructions([...completedInstructions, 1]);
                setCurrentInstructionIndex(null);
                setFlashing(true);
                setTimeout(() => setFlashing(false), 300);
              }
            }
            break;

          case 2:
            // Nod detection
            const nosePosition = landmarks.positions[30];

            if (initialNoseY.current === null) {
              initialNoseY.current = nosePosition.y;
            } else {
              const verticalMovement = Math.abs(
                nosePosition.y - initialNoseY.current
              );

              if (verticalMovement > nodThreshold && !nodDone.current) {
                nodDone.current = true;
                setCompletedInstructions([...completedInstructions, 2]);
                setCurrentInstructionIndex(null);
              }
            }
            break;

          default:
            break;
        }
      }
    }
  }, [currentInstructionIndex, completedInstructions]);

  // Effects
  useEffect(() => {
    loadModels();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [loadModels]);

  useEffect(() => {
    if (videoRef.current && canvasRef.current) {
      setLoading(false);
    }
  }, [videoRef, canvasRef]);

  useEffect(() => {
    if (currentInstructionIndex === null) {
      pickRandomInstruction();
    }
  }, [currentInstructionIndex, pickRandomInstruction]);

  useEffect(() => {
    if (currentInstructionIndex !== null) {
      setFlashing(true);
      setTimeout(() => setFlashing(false), 500);
    }
  }, [currentInstructionIndex]);

  useEffect(() => {
    const interval = setInterval(async () => {
      await detectFace();
    }, 100);

    return () => clearInterval(interval);
  }, [detectFace]);

  return (
    <div className='relative w-full max-w-4xl mx-auto'>
      {loading ? (
        <div className='text-center text-white'>
          <p>Memuat model pengenalan wajah...</p>
        </div>
      ) : (
        <>
          <div
            className={`mb-4 p-4 rounded-lg text-center ${
              flashing ? "bg-green-500" : "bg-gray-800"
            } transition-colors duration-300`}>
            <p className='text-lg text-white'>
              {instructions[currentInstructionIndex]}
            </p>
          </div>

          <div className='relative border-4 border-gray-700 rounded-lg overflow-hidden'>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onPlay={() => {
                const interval = setInterval(detectFace, 100);
                return () => clearInterval(interval);
              }}
              className='w-full h-auto'
            />
            <canvas
              ref={canvasRef}
              className='absolute top-0 left-0 w-full h-full'
            />
          </div>

          {isLivenessVerified && (
            <div className='mt-4 p-4 bg-green-600 rounded-lg text-center'>
              <p className='text-white text-lg'>
                Verifikasi Liveness Berhasil!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LivenessCheck;
