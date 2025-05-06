"use client";
import { useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { checkModelInIndexedDB, saveModelToIndexedDB } from "../lib/indexedDB";

export const useFaceRecognition = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectInterval, setDetectInterval] = useState(null);
  const [faceRecognized, setFaceRecognized] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [faceDetectionProgress, setFaceDetectionProgress] = useState(0);
  const [isFaceDetecting, setIsFaceDetecting] = useState(false);

  // Increase these thresholds for more strict detection
  const REQUIRED_DETECTIONS = 10; // Increased from 3 to 10
  const MINIMUM_CONFIDENCE = 0.6; // Higher confidence threshold (0-1)
  const MIN_DETECTION_TIME_MS = 3000; // Minimum 3 seconds of continuous detection
  
  useEffect(() => {
    const initializeBackend = async () => {
      await tf.setBackend("webgl");
      await tf.ready();
      loadModels();
    };
    initializeBackend();

    return () => {
      if (detectInterval) clearInterval(detectInterval);
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
      // Check which models are already cached
      const modelStatuses = await Promise.all(
        modelConfigs.map(async ({ name }) => {
          const isCached = await checkModelInIndexedDB(name);
          return { name, isCached };
        })
      );

      const totalModels = modelConfigs.length;
      let loadedModels = modelStatuses.filter(model => model.isCached).length;
      
      // Update initial loading percentage based on cached models
      setLoadingPercentage(Math.floor((loadedModels / totalModels) * 100));
      
      // Load all models (browser will use cache for already loaded models)
      for (let i = 0; i < modelConfigs.length; i++) {
        const { name, net } = modelConfigs[i];
        const isCached = modelStatuses[i].isCached;
        
        try {
          if (isCached) {
            console.log(`Model ${name} found in cache`);
          } else {
            console.log(`Loading ${name} from server`);
          }
          
          // Load the model (cached or not)
          await net.loadFromUri(MODEL_URL);
          
          // Save to IndexedDB if not already cached
          if (!isCached) {
            await saveModelToIndexedDB(name, true);
          }
          
          // Update loading percentage
          loadedModels++;
          setLoadingPercentage(Math.floor((loadedModels / totalModels) * 100));
          
        } catch (err) {
          console.error(`Error loading ${name}:`, err);
          throw err;
        }
      }

      setModelsLoaded(true);
      setLoadingPercentage(100);
      console.log("All face recognition models loaded successfully");
    } catch (error) {
      console.error("Error loading face recognition models:", error);
      setModelsLoaded(false);
    }
  };

  const loadLabeledImages = async (userData) => {
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

      for (const fotoWajah of student.foto_wajah) {
        try {
          const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}${fotoWajah.url}`;
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

  const startFaceDetection = async ({
    videoRef,
    canvasRef,
    userData,
    onFaceRecognized,
    videoWidth,
    videoHeight,
  }) => {
    const labeledDescriptors = await loadLabeledImages(userData);

    if (labeledDescriptors.length === 0) {
      console.error("No valid face descriptors loaded");
      return;
    }

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);
    const recognizedFaces = new Map();
    let detectionStartTime = null;
    
    // Reset face detection state
    setFaceDetectionProgress(0);
    setIsFaceDetecting(true);
    setFaceRecognized(false);

    if (detectInterval) clearInterval(detectInterval);

    // Ensure canvas is properly sized to match video dimensions
    const setupCanvas = () => {
      if (canvasRef.current && videoRef.current) {
        // Get the actual displayed size of the video element
        const videoDimensions = videoRef.current.getBoundingClientRect();
        canvasRef.current.width = videoDimensions.width;
        canvasRef.current.height = videoDimensions.height;
        
        return {
          width: videoDimensions.width,
          height: videoDimensions.height
        };
      }
      return { width: videoWidth, height: videoHeight };
    };

    const interval = setInterval(async () => {
      if (canvasRef.current && videoRef.current && videoRef.current.readyState === 4) {
        // Get the current dimensions and setup the canvas
        const displaySize = setupCanvas();
        
        try {
          // Detect faces with higher quality settings
          const detectionOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: 416, // Increased from 320 for better accuracy
            scoreThreshold: 0.5
          });
          
          const detections = await faceapi
            .detectAllFaces(videoRef.current, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptors();

          // Clear previous drawings
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(0, 0, displaySize.width, displaySize.height);
          
          // Skip if no faces detected
          if (!detections || detections.length === 0) {
            detectionStartTime = null;
            setFaceDetectionProgress(0);
            return;
          }

          // Resize detections to match display size
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          let matchFound = false;
          
          resizedDetections.forEach((detection) => {
            const match = faceMatcher.findBestMatch(detection.descriptor);
            const distance = match.distance;
            const label = distance < MINIMUM_CONFIDENCE ? match.label : "unknown";
            const boxColor = label !== "unknown" 
              ? { r: 0, g: 255, b: 0, a: 0.5 } // Green for match
              : { r: 255, g: 0, b: 0, a: 0.5 }; // Red for unknown
            
            // Draw box with padding for better coverage
            const { box } = detection.detection;
            const paddedBox = {
              x: Math.max(0, box.x - 5),
              y: Math.max(0, box.y - 5),
              width: Math.min(displaySize.width - box.x, box.width + 10),
              height: Math.min(displaySize.height - box.y, box.height + 10)
            };
            
            // Draw face box with custom drawing for better accuracy
            ctx.strokeStyle = `rgba(${boxColor.r}, ${boxColor.g}, ${boxColor.b}, 0.8)`;
            ctx.lineWidth = 2;
            ctx.strokeRect(paddedBox.x, paddedBox.y, paddedBox.width, paddedBox.height);
            
            // Draw label background
            const labelText = label !== "unknown" 
              ? `${label} (${Math.round((1-distance) * 100)}%)` 
              : "Unknown";
            const textWidth = ctx.measureText(labelText).width + 10;
            ctx.fillStyle = `rgba(${boxColor.r}, ${boxColor.g}, ${boxColor.b}, 0.7)`;
            ctx.fillRect(
              paddedBox.x, 
              paddedBox.y - 20, 
              textWidth, 
              20
            );
            
            // Draw label text
            ctx.fillStyle = "white";
            ctx.font = "16px Arial";
            ctx.fillText(
              labelText, 
              paddedBox.x + 5, 
              paddedBox.y - 5
            );
            
            // Draw facial landmarks for better visualization
            if (detection.landmarks) {
              const landmarks = detection.landmarks.positions;
              ctx.fillStyle = "#fff";
              
              // Draw key facial points
              for (const point of landmarks) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                ctx.fill();
              }
            }
            
            // Draw progress indicator on canvas
            if (label !== "unknown") {
              matchFound = true;
              
              // Track the first time we detected a face
              if (detectionStartTime === null) {
                detectionStartTime = Date.now();
              }
              
              // Calculate how long we've been detecting this face
              const detectionTime = Date.now() - detectionStartTime;
              
              // Update face detection counts
              recognizedFaces.set(label, (recognizedFaces.get(label) || 0) + 1);
              
              // Calculate detection progress (0-100%)
              const countProgress = Math.min(100, (recognizedFaces.get(label) / REQUIRED_DETECTIONS) * 100);
              const timeProgress = Math.min(100, (detectionTime / MIN_DETECTION_TIME_MS) * 100);
              
              // We need both count and time criteria to be met
              const totalProgress = Math.min(countProgress, timeProgress);
              setFaceDetectionProgress(totalProgress);
              
              // Draw progress bar above the face
              ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
              ctx.fillRect(paddedBox.x, paddedBox.y - 30, paddedBox.width, 6);
              ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
              ctx.fillRect(paddedBox.x, paddedBox.y - 30, paddedBox.width * (totalProgress / 100), 6);
              
              // Check if we've met both criteria for face recognition
              const hasEnoughDetections = recognizedFaces.get(label) >= REQUIRED_DETECTIONS;
              const hasEnoughTime = detectionTime >= MIN_DETECTION_TIME_MS;
              
              if (hasEnoughDetections && hasEnoughTime) {
                if (!faceRecognized) {
                  console.log(`Face recognized after ${recognizedFaces.get(label)} detections and ${detectionTime}ms`);
                  setFaceRecognized(true);
                  setIsFaceDetecting(false);
                  onFaceRecognized && onFaceRecognized();
                }
              }
            }
          });
          
          // If no face is detected in this frame, reset the timer
          if (!matchFound) {
            detectionStartTime = null;
            setFaceDetectionProgress(0);
          }
        } catch (error) {
          console.error("Error in face detection:", error);
        }
      }
    }, 100);

    setDetectInterval(interval);
  };

  return {
    modelsLoaded,
    faceRecognized,
    startFaceDetection,
    setFaceRecognized,
    loadingPercentage,
    faceDetectionProgress,
    isFaceDetecting,
  };
};
