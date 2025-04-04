"use client";
import { useState, useRef } from "react";

export const useWebcam = (videoWidth = 640, videoHeight = 480) => {
  const [captureVideo, setCaptureVideo] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();

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
    setCaptureVideo(false);
  };

  return {
    captureVideo,
    videoRef,
    canvasRef,
    startVideo,
    closeWebcam,
    videoWidth,
    videoHeight,
  };
};
