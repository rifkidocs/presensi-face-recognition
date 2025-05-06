// Fungsi untuk memeriksa apakah model sudah ada di IndexedDB
export const checkModelInIndexedDB = async (modelName) => {
  return new Promise((resolve) => {
    // Jika browser tidak support IndexedDB, kembalikan false
    if (!window.indexedDB) {
      console.log("Browser tidak mendukung IndexedDB");
      resolve(false);
      return;
    }
    
    const request = indexedDB.open("face-api-models", 1);
    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      resolve(false);
    };
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
      modelRequest.onsuccess = () => {
        const result = !!modelRequest.result;
        console.log(`Model ${modelName} cache status:`, result ? "cached" : "not cached");
        resolve(result);
      };
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
    // Jika browser tidak support IndexedDB, kembalikan resolve
    if (!window.indexedDB) {
      console.log("Browser tidak mendukung IndexedDB");
      resolve();
      return;
    }
    
    const request = indexedDB.open("face-api-models", 1);
    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(new Error("Failed to open IndexedDB"));
    };
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["models"], "readwrite");
      const store = transaction.objectStore("models");
      
      // Simpan juga timestamp untuk cache invalidation jika diperlukan
      const data = {
        data: modelData,
        timestamp: new Date().getTime()
      };
      
      const saveRequest = store.put(data, modelName);
      saveRequest.onerror = (event) => {
        console.error("Failed to save model:", event.target.error);
        reject(new Error("Failed to save model"));
      };
      saveRequest.onsuccess = () => {
        console.log(`Model ${modelName} saved to IndexedDB`);
        resolve();
      };
    };
  });
};

// Fungsi untuk mengambil model dari IndexedDB
export const getModelFromIndexedDB = async (modelName) => {
  return new Promise((resolve, reject) => {
    // Jika browser tidak support IndexedDB, reject
    if (!window.indexedDB) {
      reject(new Error("Browser tidak mendukung IndexedDB"));
      return;
    }
    
    const request = indexedDB.open("face-api-models", 1);
    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(new Error("Failed to open IndexedDB"));
    };
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["models"], "readonly");
      const store = transaction.objectStore("models");
      const modelRequest = store.get(modelName);
      modelRequest.onerror = (event) => {
        console.error("Failed to get model:", event.target.error);
        reject(new Error("Failed to get model"));
      };
      modelRequest.onsuccess = () => {
        if (modelRequest.result && modelRequest.result.data) {
          console.log(`Model ${modelName} retrieved from IndexedDB`);
          resolve(modelRequest.result.data);
        } else {
          reject(new Error("Model not found or invalid format"));
        }
      };
    };
  });
};

// Fungsi untuk menghapus model dari IndexedDB (jika diperlukan)
export const deleteModelFromIndexedDB = async (modelName) => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve();
      return;
    }
    
    const request = indexedDB.open("face-api-models", 1);
    request.onerror = () => resolve();
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("models")) {
        resolve();
        return;
      }
      const transaction = db.transaction(["models"], "readwrite");
      const store = transaction.objectStore("models");
      const deleteRequest = store.delete(modelName);
      deleteRequest.onerror = () => reject(new Error("Failed to delete model"));
      deleteRequest.onsuccess = () => {
        console.log(`Model ${modelName} deleted from IndexedDB`);
        resolve();
      };
    };
  });
};

// Fungsi untuk membersihkan cache semua model (jika diperlukan)
export const clearModelCache = async () => {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve();
      return;
    }
    
    const request = indexedDB.open("face-api-models", 1);
    request.onerror = () => resolve();
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("models")) {
        resolve();
        return;
      }
      const transaction = db.transaction(["models"], "readwrite");
      const store = transaction.objectStore("models");
      const clearRequest = store.clear();
      clearRequest.onerror = () => resolve();
      clearRequest.onsuccess = () => {
        console.log("All models cleared from IndexedDB");
        resolve();
      };
    };
  });
};
