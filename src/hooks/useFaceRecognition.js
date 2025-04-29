"use client";
import { useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

export const useFaceRecognition = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectInterval, setDetectInterval] = useState(null);
  const [faceRecognized, setFaceRecognized] = useState(false);

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
            recognizedFaces.set(label, (recognizedFaces.get(label) || 0) + 1);

            if (recognizedFaces.get(label) > 3) {
              if (!faceRecognized) {
                setFaceRecognized(true);
                onFaceRecognized && onFaceRecognized();
              }
            }
          }
        });
      }
    }, 100);

    setDetectInterval(interval);
  };

  return {
    modelsLoaded,
    faceRecognized,
    startFaceDetection,
    setFaceRecognized,
  };
};
