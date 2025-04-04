// Fungsi untuk memeriksa apakah model sudah ada di IndexedDB
export const checkModelInIndexedDB = async (modelName) => {
  return new Promise((resolve) => {
    const request = indexedDB.open("face-api-models", 1);
    request.onerror = () => resolve(false);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("models")) {
        resolve(false);
        return;
      }
      const transaction = db.transaction(["models"], "readonly");
      const store = transaction.objectStore("models");
      const modelRequest = store.get(modelName);
      modelRequest.onerror = () => resolve(false);
      modelRequest.onsuccess = () => resolve(!!modelRequest.result);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("models")) {
        db.createObjectStore("models");
      }
    };
  });
};

// Fungsi untuk menyimpan model ke IndexedDB
export const saveModelToIndexedDB = async (modelName, modelData) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("face-api-models", 1);
    request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["models"], "readwrite");
      const store = transaction.objectStore("models");
      const saveRequest = store.put(modelData, modelName);
      saveRequest.onerror = () => reject(new Error("Failed to save model"));
      saveRequest.onsuccess = () => resolve();
    };
  });
};

// Fungsi untuk mengambil model dari IndexedDB
export const getModelFromIndexedDB = async (modelName) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("face-api-models", 1);
    request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["models"], "readonly");
      const store = transaction.objectStore("models");
      const modelRequest = store.get(modelName);
      modelRequest.onerror = () => reject(new Error("Failed to get model"));
      modelRequest.onsuccess = () => resolve(modelRequest.result);
    };
  });
};
