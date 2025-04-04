"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import * as faceapi from "face-api.js";
import Swal from "sweetalert2";

import {
  checkModelInIndexedDB,
  saveModelToIndexedDB,
  getModelFromIndexedDB,
} from "../lib/indexedDB";
import {
  checkTodayPresence,
  getActiveSchedule,
  isWithinPresenceTime,
} from "../lib/presenceUtils";
import {
  detectMouthOpen,
  detectHeadTurn,
  detectNod,
  detectAndDrawFace,
} from "../lib/faceDetection";

const LivenessCheck = ({ onVerificationComplete, userData }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const photoCanvasRef = useRef(null); // Canvas tambahan untuk menyimpan foto tanpa landmark
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(null);
  const [completedInstructions, setCompletedInstructions] = useState([]);
  const [isLivenessVerified, setIsLivenessVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flashing, setFlashing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false); // State untuk mencegah pengiriman ganda

  // Validasi awal untuk jadwal dan status presensi
  useEffect(() => {
    const validatePresence = async () => {
      try {
        // Cek jadwal presensi
        const schedule = await getActiveSchedule();
        if (!schedule) {
          Swal.fire({
            title: "Tidak Ada Jadwal Aktif",
            text: "Tidak ada jadwal presensi yang aktif saat ini. Silakan hubungi administrator untuk informasi lebih lanjut.",
            icon: "warning",
            confirmButtonText: "OK",
            confirmButtonColor: "#3085d6",
          });
          onVerificationComplete(false);
          return;
        }

        // Cek apakah waktu presensi masih dalam rentang yang diizinkan
        const presenceTime = isWithinPresenceTime(schedule);
        if (!presenceTime.isValid) {
          let alertMessage = "Tidak ada jadwal presensi yang aktif saat ini.";
          if (schedule && schedule.attributes) {
            alertMessage = `Jadwal presensi masuk: ${schedule.attributes.jam_masuk} - ${schedule.attributes.batas_jam_masuk}\nJadwal presensi pulang: ${schedule.attributes.jam_pulang} - ${schedule.attributes.batas_jam_pulang}`;
          }
          Swal.fire({
            title: "Di Luar Waktu Presensi",
            text: alertMessage,
            icon: "error",
            confirmButtonText: "OK",
            confirmButtonColor: "#3085d6",
          });
          onVerificationComplete(false);
          return;
        }

        // Cek apakah siswa sudah presensi hari ini sesuai dengan jenis presensi yang berlaku
        const today = new Date().toISOString().split("T")[0];
        const checkResponse = await fetch(
          `http://localhost:1337/api/presensi-siswas?filters[siswa][id][$eq]=${userData.data.id}&filters[waktu_absen][$gte]=${today}&filters[jenis_absen][$eq]=${presenceTime.type}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!checkResponse.ok) {
          throw new Error("Gagal mengecek status presensi");
        }

        const checkResult = await checkResponse.json();
        if (checkResult.data.length > 0) {
          Swal.fire({
            title: "Sudah Presensi",
            text: `Anda sudah melakukan presensi ${presenceTime.type} hari ini`,
            icon: "info",
            confirmButtonText: "OK",
            confirmButtonColor: "#3085d6",
          });
          onVerificationComplete(false);
          return;
        }

        // Jika semua validasi berhasil, lanjutkan dengan loading model
        loadModels();
      } catch (error) {
        console.error("Error validating presence:", error);
        Swal.fire({
          title: "Error",
          text: "Terjadi kesalahan saat memvalidasi presensi. Silakan coba lagi.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#3085d6",
        });
        onVerificationComplete(false);
      }
    };

    validatePresence();
  }, []);

  // Movement thresholds
  const nodThreshold = 20;
  const mouthOpenThreshold = 30; // Menurunkan threshold untuk meningkatkan sensitivitas
  const headTurnThreshold = 25; // Threshold untuk deteksi gerakan kepala ke samping

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
      const modelNames = ["tiny_face_detector", "face_landmark_68"];
      const modelPromises = modelNames.map(async (modelName) => {
        const isModelCached = await checkModelInIndexedDB(modelName);

        if (isModelCached) {
          console.log(`Loading ${modelName} from IndexedDB`);
          const modelData = await getModelFromIndexedDB(modelName);
          // Implementasi loading dari cache akan ditambahkan di sini
          await faceapi.nets[
            modelName === "tiny_face_detector"
              ? "tinyFaceDetector"
              : "faceLandmark68Net"
          ].loadFromUri("/models");
        } else {
          console.log(`Downloading ${modelName} from server`);
          await faceapi.nets[
            modelName === "tiny_face_detector"
              ? "tinyFaceDetector"
              : "faceLandmark68Net"
          ].loadFromUri("/models");
          // Simpan model ke IndexedDB untuk penggunaan selanjutnya
          await saveModelToIndexedDB(modelName, true);
        }
      });

      await Promise.all(modelPromises);

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

  const pickRandomInstruction = useCallback(async () => {
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
    } else if (!isSubmitted) {
      setIsLivenessVerified(true);
      setIsSubmitted(true); // Tandai bahwa proses pengiriman sudah dimulai

      // Ambil foto dari photoCanvas (tanpa landmark) dan konversi ke blob
      const photoData = photoCanvasRef.current.toDataURL("image/jpeg");
      const blob = await (await fetch(photoData)).blob();

      // Buat FormData untuk upload file
      const formData = new FormData();
      formData.append("files", blob, "presence-photo.jpg");

      // Dapatkan koordinat lokasi pengguna
      let koordinat_absen = "";
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        koordinat_absen = `${position.coords.latitude}, ${position.coords.longitude}`;
      } catch (err) {
        console.error("Error getting location:", err);
        setError(
          "Gagal mendapatkan lokasi. Pastikan Anda mengizinkan akses lokasi."
        );
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        // Upload file foto terlebih dahulu
        const uploadResponse = await fetch("http://localhost:1337/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Gagal mengupload foto");
        }

        const uploadResult = await uploadResponse.json();
        const fotoId = uploadResult[0].id; // Mengambil ID foto dari array response

        // Dapatkan jadwal dan tipe presensi yang aktif
        const schedule = await getActiveSchedule();
        const presenceTime = isWithinPresenceTime(schedule);

        // Lanjutkan dengan menyimpan data presensi
        const checkResponse = await fetch(
          `http://localhost:1337/api/presensi-siswas?filters[siswa][id][$eq]=${userData.data.id}&filters[waktu_absen][$gte]=${today}&filters[jenis_absen][$eq]=${presenceTime.type}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!checkResponse.ok) {
          throw new Error("Gagal mengecek data presensi");
        }

        const existingPresence = await checkResponse.json();
        if (existingPresence.data.length > 0) {
          Swal.fire({
            title: "Presensi Sudah Dilakukan",
            text: `Anda sudah melakukan presensi ${presenceTime.type} hari ini.`,
            icon: "info",
            confirmButtonText: "OK",
            confirmButtonColor: "#3085d6",
          });
          throw new Error(`Sudah presensi ${presenceTime.type} hari ini`);
        }

        // Siapkan dan kirim data presensi
        const presenceData = {
          data: {
            waktu_absen: new Date().toISOString(),
            jenis_absen: presenceTime.type,
            koordinat_absen,
            is_validated: true,
            foto_absen: {
              id: fotoId,
            },
            siswa: {
              id: userData.data.id,
            },
          },
        };
        if (!presenceTime.isValid) {
          let alertMessage = "Tidak ada jadwal presensi yang aktif saat ini.";
          if (schedule && schedule.attributes) {
            alertMessage = `Jadwal presensi masuk: ${schedule.attributes.jam_masuk} - ${schedule.attributes.batas_jam_masuk}\nJadwal presensi pulang: ${schedule.attributes.jam_pulang} - ${schedule.attributes.batas_jam_pulang}`;
          }
          Swal.fire({
            title: "Di Luar Waktu Presensi",
            text: alertMessage,
            icon: "error",
            confirmButtonText: "OK",
            confirmButtonColor: "#3085d6",
          });
          throw new Error("Di luar jadwal presensi");
        }

        // Kirim data presensi
        const response = await fetch(
          "http://localhost:1337/api/presensi-siswas",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(presenceData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message || "Gagal mengirim data presensi"
          );
        }

        // Tampilkan notifikasi sukses
        Swal.fire({
          title: "Berhasil!",
          text: "Verifikasi Liveness Berhasil! Presensi Anda telah berhasil dicatat.",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#3085d6",
        });

        // Hentikan stream kamera setelah verifikasi selesai
        if (videoRef.current?.srcObject) {
          videoRef.current.srcObject
            .getTracks()
            .forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }

        onVerificationComplete(true);
      } catch (err) {
        setError(err.message);
        console.error("Error sending presence data:", err);
        if (
          err.message === "Sudah presensi hari ini" ||
          err.message === "Tidak ada jadwal presensi aktif" ||
          err.message === "Di luar jadwal presensi"
        ) {
          // Alert sudah ditampilkan sebelumnya
        } else if (err.message.includes("Sudah presensi")) {
          // Tampilkan pesan spesifik untuk presensi yang sudah dilakukan
          Swal.fire({
            title: "Presensi Sudah Dilakukan",
            text: err.message,
            icon: "info",
            confirmButtonText: "OK",
            confirmButtonColor: "#3085d6",
          });
        } else {
          Swal.fire({
            title: "Terjadi Kesalahan",
            text: "Terjadi kesalahan saat mencatat presensi. Silakan periksa koneksi internet Anda dan coba lagi. Jika masalah berlanjut, hubungi administrator.",
            icon: "error",
            confirmButtonText: "OK",
            confirmButtonColor: "#3085d6",
          });
        }
      } finally {
        setSubmitting(false);
      }
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
        const photoCanvasCtx = photoCanvasRef.current.getContext("2d");

        const dims = faceapi.matchDimensions(
          canvasRef.current,
          videoRef.current,
          true
        );
        // Set dimensi yang sama untuk photoCanvas
        photoCanvasRef.current.width = canvasRef.current.width;
        photoCanvasRef.current.height = canvasRef.current.height;

        const resizedDetections = faceapi.resizeResults(detections, dims);

        // Clear both canvases
        canvasCtx.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        photoCanvasCtx.clearRect(
          0,
          0,
          photoCanvasRef.current.width,
          photoCanvasRef.current.height
        );

        // Draw video frame to photo canvas first
        photoCanvasCtx.drawImage(
          videoRef.current,
          0,
          0,
          photoCanvasRef.current.width,
          photoCanvasRef.current.height
        );

        // Draw landmarks on display canvas
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
            <canvas ref={photoCanvasRef} className='hidden' />
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
