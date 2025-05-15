import * as faceapi from "face-api.js";

// Fungsi untuk mendeteksi kedipan mata
// Menggunakan landmark wajah untuk menghitung jarak antara kelopak mata atas dan bawah
export const detectBlink = (landmarks, threshold) => {
  // Mengambil posisi landmark untuk mata kiri dan kanan
  const leftEyeTop = landmarks.positions[37];
  const leftEyeBottom = landmarks.positions[41];
  const rightEyeTop = landmarks.positions[44];
  const rightEyeBottom = landmarks.positions[46];

  // Menghitung jarak antara kelopak mata atas dan bawah
  const leftEyeDistance = leftEyeBottom.y - leftEyeTop.y;
  const rightEyeDistance = rightEyeBottom.y - rightEyeTop.y;

  // Mengembalikan true jika kedua mata terdeteksi berkedip (jarak lebih kecil dari threshold)
  return leftEyeDistance < threshold && rightEyeDistance < threshold;
};

// Fungsi untuk mendeteksi gerakan kepala ke kiri dan kanan
// Menggunakan posisi hidung sebagai referensi untuk gerakan horizontal
export const detectHeadTurn = (nose, initialX, maxX, minX, threshold) => {
  // Memperbarui nilai maksimum dan minimum posisi X hidung
  const currentMaxX = Math.max(maxX, nose.x);
  const currentMinX = Math.min(minX, nose.x);
  // Menghitung total gerakan horizontal
  const horizontalMovement = currentMaxX - currentMinX;
  return {
    detected: horizontalMovement > threshold,
    maxX: currentMaxX,
    minX: currentMinX,
  };
};

// Fungsi untuk mendeteksi anggukan kepala
// Menggunakan posisi hidung sebagai referensi untuk gerakan vertikal
export const detectNod = (nosePosition, initialY, threshold) => {
  // Menghitung jarak gerakan vertikal dari posisi awal
  const verticalMovement = Math.abs(nosePosition.y - initialY);
  return verticalMovement > threshold;
};

// Fungsi untuk mendeteksi dan menggambar wajah pada canvas
// Menggunakan face-api.js untuk deteksi wajah dan landmark
export const detectAndDrawFace = async (video, canvas, photoCanvas, dims) => {
  // Mendeteksi wajah dan landmark menggunakan face-api.js
  const detections = await faceapi
    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();

  if (detections.length > 0) {
    // Mendapatkan context untuk kedua canvas
    const canvasCtx = canvas.getContext("2d");
    const photoCanvasCtx = photoCanvas.getContext("2d");

    // Menyesuaikan ukuran photoCanvas dengan canvas utama
    photoCanvas.width = canvas.width;
    photoCanvas.height = canvas.height;

    // Menyesuaikan hasil deteksi dengan ukuran tampilan
    const resizedDetections = faceapi.resizeResults(detections, dims);

    // Membersihkan kedua canvas
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    photoCanvasCtx.clearRect(0, 0, photoCanvas.width, photoCanvas.height);

    // Menggambar frame video ke photoCanvas
    photoCanvasCtx.drawImage(
      video,
      0,
      0,
      photoCanvas.width,
      photoCanvas.height
    );

    // Menggambar deteksi dan landmark pada canvas utama
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

    return {
      landmarks: detections[0].landmarks,
      detection: detections[0],
    };
  }

  return null;
};
