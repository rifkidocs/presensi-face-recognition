import * as faceapi from "face-api.js";

// Fungsi untuk mendeteksi kedipan mata
export const detectBlink = (landmarks, threshold) => {
  const leftEyeTop = landmarks.positions[37];
  const leftEyeBottom = landmarks.positions[41];
  const rightEyeTop = landmarks.positions[44];
  const rightEyeBottom = landmarks.positions[46];

  const leftEyeDistance = leftEyeBottom.y - leftEyeTop.y;
  const rightEyeDistance = rightEyeBottom.y - rightEyeTop.y;

  // Kedipan terdeteksi jika jarak mata lebih kecil dari threshold
  return leftEyeDistance < threshold && rightEyeDistance < threshold;
};

// Fungsi untuk mendeteksi gerakan kepala ke kiri dan kanan
export const detectHeadTurn = (nose, initialX, maxX, minX, threshold) => {
  const currentMaxX = Math.max(maxX, nose.x);
  const currentMinX = Math.min(minX, nose.x);
  const horizontalMovement = currentMaxX - currentMinX;
  return {
    detected: horizontalMovement > threshold,
    maxX: currentMaxX,
    minX: currentMinX,
  };
};

// Fungsi untuk mendeteksi anggukan kepala
export const detectNod = (nosePosition, initialY, threshold) => {
  const verticalMovement = Math.abs(nosePosition.y - initialY);
  return verticalMovement > threshold;
};

// Fungsi untuk mendeteksi dan menggambar wajah pada canvas
export const detectAndDrawFace = async (video, canvas, photoCanvas, dims) => {
  const detections = await faceapi
    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();

  if (detections.length > 0) {
    const canvasCtx = canvas.getContext("2d");
    const photoCanvasCtx = photoCanvas.getContext("2d");

    // Set dimensi yang sama untuk photoCanvas
    photoCanvas.width = canvas.width;
    photoCanvas.height = canvas.height;

    const resizedDetections = faceapi.resizeResults(detections, dims);

    // Clear both canvases
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    photoCanvasCtx.clearRect(0, 0, photoCanvas.width, photoCanvas.height);

    // Draw video frame to photo canvas first
    photoCanvasCtx.drawImage(
      video,
      0,
      0,
      photoCanvas.width,
      photoCanvas.height
    );

    // Draw landmarks on display canvas
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

    return {
      landmarks: detections[0].landmarks,
      detection: detections[0],
    };
  }

  return null;
};
