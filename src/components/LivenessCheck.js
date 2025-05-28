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
import { useLocation } from "../hooks/useLocation";
import {
  detectMouthOpen,
  detectHeadTurn,
  detectNod,
  detectAndDrawFace,
} from "../lib/faceDetection";

// Komponen untuk melakukan verifikasi liveness (keberadaan manusia)
const LivenessCheck = ({ onVerificationComplete, userData }) => {
  // Referensi untuk elemen video dan canvas
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const photoCanvasRef = useRef(null); // Canvas tambahan untuk menyimpan foto tanpa landmark

  // State untuk mengelola proses verifikasi
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(null);
  const [completedInstructions, setCompletedInstructions] = useState([]);
  const [isLivenessVerified, setIsLivenessVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flashing, setFlashing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [faceVerificationFailed, setFaceVerificationFailed] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [faceDetectionProgress, setFaceDetectionProgress] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState('');

  // Konstanta untuk konfigurasi deteksi
  const REQUIRED_DETECTIONS = 3;
  const MIN_DETECTION_TIME_MS = 1000;

  // Threshold untuk deteksi gerakan
  const nodThreshold = 70;
  const headTurnThreshold = 45;
  const eyebrowThreshold = 25;

  // Referensi untuk flag dan counter
  const eyebrowRaiseDone = useRef(false);
  const headTurnDone = useRef(false);
  const nodDone = useRef(false);
  const initialNoseX = useRef(null);
  const initialNoseY = useRef(null);
  const maxNoseX = useRef(null);
  const minNoseX = useRef(null);
  const initialEyebrowY = useRef(null);

  // Daftar instruksi untuk verifikasi liveness
  const instructions = [
    {
      text: "Silakan angkat kepala Anda",
      icon: "👆",
      description: "Angkat kepala Anda ke atas dengan jelas"
    },
    {
      text: "Silakan gerakkan kepala Anda ke kiri atau kanan",
      icon: "↔️",
      description: "Gerakkan kepala Anda ke kiri atau kanan dengan jelas"
    },
    {
      text: "Silakan anggukkan kepala Anda",
      icon: "⬇️",
      description: "Anggukkan kepala Anda dengan jelas"
    },
  ];

  // Hook untuk mengelola lokasi
  const {
    locationData,
    locationError,
    isWithinRadius,
    loading: locationLoading,
    checkLocation,
  } = useLocation();

  // Validasi awal untuk jadwal dan status presensi
  useEffect(() => {
    const validatePresence = async () => {
      try {
        // Gunakan status lokasi yang sudah divalidasi di WebcamContainer
        // Tidak perlu melakukan pengecekan lokasi ulang

        if (locationError) {
          Swal.fire({
            title: "Error Lokasi",
            text: locationError,
            icon: "error",
            confirmButtonText: "OK",
            confirmButtonColor: "#3085d6",
          });
          onVerificationComplete(false);
          return;
        }
        // Cek jadwal presensi sesuai dengan role pengguna
        const schedule = await getActiveSchedule(userData.role);
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

        // Cek apakah pengguna sudah presensi hari ini sesuai dengan jenis presensi yang berlaku
        const today = new Date().toISOString().split("T")[0];
        let endpoint = "";
        let filterField = "";

        // Tentukan endpoint dan filter berdasarkan role
        switch (userData.role) {
          case "siswa":
            endpoint = "presensi-siswas";
            filterField = "siswa";
            break;
          case "guru":
            endpoint = "presensi-gurus";
            filterField = "guru";
            break;
          case "pegawai":
            endpoint = "presensi-pegawais";
            filterField = "pegawai";
            break;
          default:
            throw new Error("Role tidak valid");
        }

        const checkResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/${endpoint}?filters[${filterField}][id][$eq]=${userData.data.id}&filters[waktu_absen][$gte]=${today}&filters[jenis_absen][$eq]=${presenceTime.type}`,
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

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const modelNames = ["tiny_face_detector", "face_landmark_68", "face_recognition"];
      const modelPromises = modelNames.map(async (modelName) => {
        const isModelCached = await checkModelInIndexedDB(modelName);

        if (isModelCached) {
          console.log(`Loading ${modelName} from IndexedDB`);
          await faceapi.nets[
            modelName === "tiny_face_detector"
              ? "tinyFaceDetector"
              : modelName === "face_landmark_68"
              ? "faceLandmark68Net"
              : "faceRecognitionNet"
          ].loadFromUri("/models");
          console.log(`${modelName} loaded from cache`);
        } else {
          console.log(`Downloading ${modelName} from server`);
          await faceapi.nets[
            modelName === "tiny_face_detector"
              ? "tinyFaceDetector"
              : modelName === "face_landmark_68"
              ? "faceLandmark68Net"
              : "faceRecognitionNet"
          ].loadFromUri("/models");
          await saveModelToIndexedDB(modelName, true);
          console.log(`${modelName} saved to cache`);
        }
      });

      await Promise.all(modelPromises);

      // Load labeled descriptors for face verification
      if (userData && userData.data && userData.data.foto_wajah) {
        const descriptions = [];
        for (const fotoWajah of userData.data.foto_wajah) {
          try {
            const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}${fotoWajah.url}`;
            const img = await faceapi.fetchImage(imageUrl);
            const detection = await faceapi
              .detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (detection) {
              descriptions.push(detection.descriptor);
            }
          } catch (error) {
            console.warn(`Error loading image for ${userData.data.nama}:`, error);
          }
        }

        if (descriptions.length > 0) {
          const labeledDescriptor = new faceapi.LabeledFaceDescriptors(
            userData.data.nama,
            descriptions
          );
          setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptor, 0.5));
        }
      }

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
  }, [userData]);

  const handleMovementComplete = useCallback((index) => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1000);
    setCompletedInstructions(prev => [...prev, index]);
    setCurrentInstructionIndex(null);
    setCurrentStep(prev => prev + 1);
  }, []);

  const detectFace = useCallback(async () => {
    if (
      videoRef.current &&
      canvasRef.current &&
      currentInstructionIndex !== null
    ) {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (
        detections.length > 0 &&
        canvasRef.current &&
        photoCanvasRef.current
      ) {
        const landmarks = detections[0].landmarks;
        const canvasCtx = canvasRef.current.getContext("2d");
        const photoCanvasCtx = photoCanvasRef.current.getContext("2d");

        if (!canvasCtx || !photoCanvasCtx) {
          console.error("Failed to get canvas context");
          return;
        }

        const dims = faceapi.matchDimensions(
          canvasRef.current,
          videoRef.current,
          true
        );
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

        // Simpan face descriptor untuk verifikasi di akhir
        setFaceDescriptor(detections[0].descriptor);

        switch (currentInstructionIndex) {
          case 0:
            // Eyebrow raise detection
            const leftEyebrow = landmarks.positions[19];
            const rightEyebrow = landmarks.positions[24];

            if (initialEyebrowY.current === null) {
              initialEyebrowY.current = (leftEyebrow.y + rightEyebrow.y) / 2;
            } else {
              const currentEyebrowY = (leftEyebrow.y + rightEyebrow.y) / 2;
              const eyebrowMovement = initialEyebrowY.current - currentEyebrowY;

              if (eyebrowMovement > eyebrowThreshold && !eyebrowRaiseDone.current) {
                eyebrowRaiseDone.current = true;
                handleMovementComplete(0);
              }
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

              if (horizontalMovement > headTurnThreshold && !headTurnDone.current) {
                headTurnDone.current = true;
                handleMovementComplete(1);
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
                handleMovementComplete(2);
              }
            }
            break;

          default:
            break;
        }
      }
    }
  }, [currentInstructionIndex, handleMovementComplete]);

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
      setFlashing(true);
      setTimeout(() => setFlashing(false), 500);
    } else if (!isSubmitted) {
      try {
        let detectionCount = 0;
        let startTime = Date.now();
        let lastDetectionTime = startTime;
        let faceDescriptor = null;

        const verifyFace = async () => {
          const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

          if (detections.length > 0) {
            const currentTime = Date.now();
            if (currentTime - lastDetectionTime >= 100) {
              detectionCount++;
              faceDescriptor = detections[0].descriptor;
              lastDetectionTime = currentTime;
              
              const progress = Math.min(100, (detectionCount / REQUIRED_DETECTIONS) * 100);
              setFaceDetectionProgress(progress);
            }
          }

          if (detectionCount >= REQUIRED_DETECTIONS && Date.now() - startTime >= MIN_DETECTION_TIME_MS) {
            if (faceMatcher && faceDescriptor) {
              const match = faceMatcher.findBestMatch(faceDescriptor);
              if (match.distance > 0.5) {
                setFaceVerificationFailed(true);
                setVerificationStatus('failed');
                Swal.fire({
                  title: "Verifikasi Gagal",
                  text: "Wajah tidak cocok dengan data yang terdaftar. Pastikan Anda adalah orang yang sama dengan yang melakukan verifikasi sebelumnya.",
                  icon: "error",
                  confirmButtonText: "OK",
                  confirmButtonColor: "#3085d6",
                }).then(() => {
                  window.location.reload();
                });
                onVerificationComplete(false);
                return;
              }
            }

            setVerificationStatus('success');
            setIsLivenessVerified(true);
            setIsSubmitted(true);

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
              const uploadResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
                {
                  method: "POST",
                  body: formData,
                }
              );

              if (!uploadResponse.ok) {
                throw new Error("Gagal mengupload foto");
              }

              const uploadResult = await uploadResponse.json();
              const fotoId = uploadResult[0].id; // Mengambil ID foto dari array response

              // Dapatkan jadwal dan tipe presensi yang aktif
              const schedule = await getActiveSchedule(userData.role);
              const presenceTime = isWithinPresenceTime(schedule);

              // Dapatkan tanggal hari ini
              const today = new Date().toISOString().split("T")[0];

              // Lanjutkan dengan menyimpan data presensi
              let endpoint = "";
              let filterField = "";

              // Tentukan endpoint dan filter berdasarkan role
              switch (userData.role) {
                case "siswa":
                  endpoint = "presensi-siswas";
                  filterField = "siswa";
                  break;
                case "guru":
                  endpoint = "presensi-gurus";
                  filterField = "guru";
                  break;
                case "pegawai":
                  endpoint = "presensi-pegawais";
                  filterField = "pegawai";
                  break;
                default:
                  throw new Error("Role tidak valid");
              }
              const checkResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/${endpoint}?filters[${filterField}][id][$eq]=${userData.data.id}&filters[waktu_absen][$gte]=${today}&filters[jenis_absen][$eq]=${presenceTime.type}`,
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
                  [userData.role]: {
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
                `${process.env.NEXT_PUBLIC_API_URL}/api/${endpoint}`,
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

              // Tampilkan notifikasi sukses dan tunggu konfirmasi
              Swal.fire({
                title: "Berhasil!",
                text: "Verifikasi Liveness Berhasil! Presensi Anda telah berhasil dicatat.",
                icon: "success",
                confirmButtonText: "OK",
                confirmButtonColor: "#3085d6",
              }).then((result) => {
                if (result.isConfirmed) {
                  let selectedRating = 0;
                  
                  // Tampilkan dialog rating dengan bintang
                  Swal.fire({
                    title: 'Bagaimana pengalaman Anda?',
                    text: 'Beri rating untuk pengalaman presensi Anda',
                    icon: 'question',
                    html: `
                      <div class="rating-container" style="text-align: center; margin: 20px 0;">
                        <div class="stars" style="font-size: 40px;">
                          <span class="star" data-rating="1" style="cursor: pointer; margin: 0 5px; color: #ccc;">★</span>
                          <span class="star" data-rating="2" style="cursor: pointer; margin: 0 5px; color: #ccc;">★</span>
                          <span class="star" data-rating="3" style="cursor: pointer; margin: 0 5px; color: #ccc;">★</span>
                          <span class="star" data-rating="4" style="cursor: pointer; margin: 0 5px; color: #ccc;">★</span>
                          <span class="star" data-rating="5" style="cursor: pointer; margin: 0 5px; color: #ccc;">★</span>
                        </div>
                        <div class="rating-text" style="margin-top: 10px; color: #666;"></div>
                      </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'Kirim Rating',
                    cancelButtonText: 'Lewati',
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    showClass: {
                      popup: 'animate__animated animate__fadeInDown'
                    },
                    hideClass: {
                      popup: 'animate__animated animate__fadeOutUp'
                    },
                    didOpen: () => {
                      const stars = document.querySelectorAll('.star');
                      const ratingText = document.querySelector('.rating-text');
                      
                      const texts = {
                        1: 'Sangat Buruk',
                        2: 'Buruk',
                        3: 'Cukup',
                        4: 'Baik',
                        5: 'Sangat Baik'
                      };

                      stars.forEach(star => {
                        star.addEventListener('mouseover', (e) => {
                          const rating = parseInt(e.target.getAttribute('data-rating'));
                          stars.forEach(s => {
                            const r = parseInt(s.getAttribute('data-rating'));
                            s.style.color = r <= rating ? '#ffd700' : '#ccc';
                          });
                          ratingText.textContent = texts[rating] || '';
                        });

                        star.addEventListener('click', (e) => {
                          selectedRating = parseInt(e.target.getAttribute('data-rating'));
                          stars.forEach(s => {
                            const r = parseInt(s.getAttribute('data-rating'));
                            s.style.color = r <= selectedRating ? '#ffd700' : '#ccc';
                          });
                          ratingText.textContent = texts[selectedRating] || '';
                        });
                      });

                      document.querySelector('.rating-container').addEventListener('mouseleave', () => {
                        stars.forEach(s => {
                          const r = parseInt(s.getAttribute('data-rating'));
                          s.style.color = r <= selectedRating ? '#ffd700' : '#ccc';
                        });
                        ratingText.textContent = texts[selectedRating] || '';
                      });
                    },
                    willClose: () => {
                      if (selectedRating === 0) {
                        Swal.showValidationMessage('Silakan pilih rating terlebih dahulu');
                        return false;
                      }
                    }
                  }).then((ratingResult) => {
                    if (ratingResult.isConfirmed && selectedRating > 0) {
                      // Kirim rating ke API
                      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ratings`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          data: {
                            pengguna: userData.data.nama,
                            role: userData.role,
                            rating: selectedRating
                          }
                        })
                      }).catch(error => {
                        console.error('Error sending rating:', error);
                      });
                    }
                    
                    // Hapus cookie jwtToken sebelum reload
                    document.cookie = "jwtToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    window.location.reload();
                  });
                }
              });

              // Hentikan stream kamera setelah verifikasi selesai
              if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach((track) => {
                  if (track.readyState === "live") {
                    track.stop();
                  }
                });
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
              if (photoCanvasRef.current) {
                const ctx = photoCanvasRef.current.getContext("2d");
                if (ctx) {
                  ctx.clearRect(
                    0,
                    0,
                    photoCanvasRef.current.width,
                    photoCanvasRef.current.height
                  );
                }
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
          } else {
            requestAnimationFrame(verifyFace);
          }
        };

        verifyFace();
      } catch (error) {
        console.error("Error during face verification:", error);
        setVerificationStatus('failed');
        Swal.fire({
          title: "Verifikasi Gagal",
          text: "Terjadi kesalahan saat verifikasi wajah. Silakan coba lagi.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#3085d6",
        }).then(() => {
          window.location.reload();
        });
        onVerificationComplete(false);
      }
    }
  }, [completedInstructions, onVerificationComplete, faceMatcher]);

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

  useEffect(() => {
    if (isLivenessVerified) {
      // Hentikan kamera dan bersihkan tampilan setelah verifikasi berhasil
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      // Panggil callback onVerificationComplete
      onVerificationComplete(true);
    }
  }, [isLivenessVerified, onVerificationComplete]);

  return (
    <div className='relative w-full max-w-4xl mx-auto'>
      {loading ? (
        <div className='text-center text-white'>
          <p>Memuat model pengenalan wajah...</p>
        </div>
      ) : !isLivenessVerified ? (
        <>
          {/* Progress Steps */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-white text-sm">
                Langkah {currentStep + 1} dari {instructions.length}
              </div>
              <div className="flex space-x-2">
                {instructions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      completedInstructions.includes(index)
                        ? "bg-green-500"
                        : index === currentInstructionIndex
                        ? "bg-blue-500 animate-pulse"
                        : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Instruction Card */}
          <div
            className={`mb-4 p-4 rounded-lg text-center transition-all duration-300 ${
              showSuccess
                ? "bg-green-500 scale-105"
                : flashing
                ? "bg-blue-500 scale-105"
                : "bg-gray-800"
            }`}>
            <div className="text-4xl mb-2 animate-bounce">
              {instructions[currentInstructionIndex]?.icon}
            </div>
            <p className='text-lg text-white font-semibold'>
              {instructions[currentInstructionIndex]?.text}
            </p>
            <p className='text-sm text-gray-300 mt-1'>
              {instructions[currentInstructionIndex]?.description}
            </p>
          </div>

          {/* Video Container */}
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
            
            {/* Face Detection Progress */}
            {completedInstructions.length === instructions.length && !isSubmitted && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm">Verifikasi Wajah:</span>
                  <span className="text-white text-sm font-bold">{Math.round(faceDetectionProgress)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      verificationStatus === 'failed' ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${faceDetectionProgress}%` }}
                  >
                    {faceDetectionProgress > 0 && (
                      <div className="h-full w-2 bg-white absolute right-0 animate-pulse"></div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-300 mt-1 text-center">
                  {verificationStatus === 'failed' ? "Verifikasi gagal, halaman akan dimuat ulang..." :
                   faceDetectionProgress < 30 ? "Tahan wajah anda tepat di depan kamera..." : 
                   faceDetectionProgress < 60 ? "Sedang memverifikasi identitas..." : 
                   faceDetectionProgress < 90 ? "Hampir selesai..." : 
                   "Verifikasi berhasil!"}
                </p>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default LivenessCheck;

const getEndpoint = (role) =>
  role === "siswa" ? "presensi-siswas" : "presensi-gurus";
const getFilterField = (role) => (role === "siswa" ? "siswa" : "guru");
