"use client";
import { useState, useRef, useEffect } from "react";

export const useWebcam = (initialWidth = 640, initialHeight = 480) => {
  const [captureVideo, setCaptureVideo] = useState(false);
  const [videoWidth, setVideoWidth] = useState(initialWidth);
  const [videoHeight, setVideoHeight] = useState(initialHeight);
  const [cameraReady, setCameraReady] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();

  const updateVideoDimensions = () => {
    if (videoRef.current) {
      // Get actual video dimensions
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      
      if (width && height) {
        setVideoWidth(width);
        setVideoHeight(height);
        
        // Update canvas dimensions if canvas exists
        if (canvasRef.current) {
          const videoRect = videoRef.current.getBoundingClientRect();
          canvasRef.current.width = videoRect.width;
          canvasRef.current.height = videoRect.height;
        }
      }
    }
  };

  const startVideo = async () => {
    setCaptureVideo(true);
    setLoadingCamera(true);
    
    try {
      // Request camera with highest resolution available
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          updateVideoDimensions();
          setCameraReady(true);
          setLoadingCamera(false);
        };
        
        // Add event listeners for dimension changes
        videoRef.current.addEventListener('play', updateVideoDimensions);
        videoRef.current.addEventListener('resize', updateVideoDimensions);
        
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error starting camera:", err);
      setLoadingCamera(false);
      
      // Fallback to lower resolution if high resolution fails
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { width: initialWidth, height: initialHeight }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play();
          setCameraReady(true);
        }
      } catch (fallbackErr) {
        console.error("Fallback camera also failed:", fallbackErr);
      }
    }
  };

  const closeWebcam = async () => {
    try {
      setCameraReady(false);
      
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

        // Remove event listeners
        videoRef.current.removeEventListener('play', updateVideoDimensions);
        videoRef.current.removeEventListener('resize', updateVideoDimensions);
        
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (captureVideo) {
        closeWebcam();
      }
    };
  }, []);

  return {
    captureVideo,
    videoRef,
    canvasRef,
    startVideo,
    closeWebcam,
    videoWidth,
    videoHeight,
    cameraReady,
    loadingCamera,
    updateVideoDimensions
  };
};
