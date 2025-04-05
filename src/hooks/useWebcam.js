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

  const closeWebcam = async () => {
    try {
      // Hentikan semua track media yang aktif
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();

        // Hentikan semua track secara eksplisit
        tracks.forEach((track) => {
          if (track.readyState === "live") {
            track.enabled = false; // Nonaktifkan track terlebih dahulu
            track.stop(); // Kemudian hentikan track
          }
        });

        // Hapus referensi stream
        videoRef.current.srcObject = null;
        videoRef.current.pause();
        videoRef.current.load();
      }

      // Bersihkan canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }
      }

      // Pastikan semua track kamera dimatikan
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      // Hentikan semua stream kamera yang masih aktif
      for (const device of videoDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: device.deviceId },
          });
          stream.getTracks().forEach((track) => {
            if (track.readyState === "live") {
              track.enabled = false;
              track.stop();
            }
          });
        } catch (err) {
          // Abaikan error jika tidak bisa mengakses kamera
          console.debug(`Cannot access camera: ${device.deviceId}`);
        }
      }

      // Revoke semua objek URL yang mungkin masih ada
      if (videoRef.current?.src) {
        URL.revokeObjectURL(videoRef.current.src);
        videoRef.current.src = "";
        videoRef.current.removeAttribute("src");
      }

      // Hapus semua event listener yang mungkin masih terikat
      if (videoRef.current) {
        const clone = videoRef.current.cloneNode(true);
        if (videoRef.current.parentNode) {
          videoRef.current.parentNode.replaceChild(clone, videoRef.current);
        }
        videoRef.current = clone;
      }

      // Force garbage collection untuk stream
      if (typeof window.gc === "function") {
        window.gc();
      }
    } catch (error) {
      console.error("Error closing webcam:", error);
    } finally {
      setCaptureVideo(false);
    }
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
