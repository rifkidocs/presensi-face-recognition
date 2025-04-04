// Fungsi untuk mengecek apakah siswa sudah presensi hari ini
export const checkTodayPresence = async (studentId) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const response = await fetch(
      `http://localhost:1337/api/presensi-siswas?filters[siswa][id][$eq]=${studentId}&filters[waktu_absen][$gte]=${today}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Gagal mengecek data presensi");
    }

    const data = await response.json();
    return data.data.length > 0;
  } catch (error) {
    console.error("Error checking today presence:", error);
    throw error;
  }
};

// Fungsi untuk mendapatkan jadwal presensi yang berlaku
export const getActiveSchedule = async () => {
  try {
    const response = await fetch(
      "http://localhost:1337/api/jadwal-presensis?filters[jenis_presensi][$eq]=siswa",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Gagal mengambil jadwal presensi");
    }

    const data = await response.json();
    return data.data[0];
  } catch (error) {
    console.error("Error getting schedule:", error);
    throw error;
  }
};

// Fungsi untuk mengecek apakah waktu saat ini masih dalam rentang waktu presensi
export const isWithinPresenceTime = (schedule) => {
  const now = new Date();
  const currentTime =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0") +
    ":" +
    now.getSeconds().toString().padStart(2, "0");

  // Cek apakah waktu saat ini dalam rentang jam masuk atau pulang
  const isEntryTime =
    currentTime >= schedule.jam_masuk &&
    currentTime <= schedule.batas_jam_masuk;
  const isExitTime =
    currentTime >= schedule.jam_pulang &&
    currentTime <= schedule.batas_jam_pulang;

  if (!isEntryTime && !isExitTime) {
    return { isValid: false, type: null };
  }

  return {
    isValid: true,
    type: isEntryTime ? "masuk" : "pulang",
  };
};
