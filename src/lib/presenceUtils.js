// Fungsi untuk mengecek apakah siswa sudah presensi hari ini
export const checkTodayPresence = async (studentId) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/presensi-siswas?filters[siswa][id][$eq]=${studentId}&filters[waktu_absen][$gte]=${today}`,
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

// Fungsi untuk mendapatkan jadwal presensi yang berlaku berdasarkan peran
export const getActiveSchedule = async (role = "siswa") => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/jadwal-presensis?filters[jenis_presensi][$eq]=${role}`,
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
  if (!schedule) {
    return { isValid: false, type: null };
  }
  
  const now = new Date();
  const currentTime =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0") +
    ":" +
    now.getSeconds().toString().padStart(2, "0");

  // Pastikan kita memiliki objek schedule yang benar
  const scheduleData = schedule.attributes ? schedule.attributes : schedule;
  
  // Pastikan semua properti yang dibutuhkan ada
  if (!scheduleData.jam_masuk || !scheduleData.batas_jam_masuk || 
      !scheduleData.jam_pulang || !scheduleData.batas_jam_pulang) {
    console.error("Schedule data is incomplete:", scheduleData);
    return { isValid: false, type: null };
  }

  // Cek apakah waktu saat ini dalam rentang jam masuk atau pulang
  const isEntryTime =
    currentTime >= scheduleData.jam_masuk &&
    currentTime <= scheduleData.batas_jam_masuk;
  const isExitTime =
    currentTime >= scheduleData.jam_pulang &&
    currentTime <= scheduleData.batas_jam_pulang;

  if (!isEntryTime && !isExitTime) {
    return { isValid: false, type: null };
  }

  return {
    isValid: true,
    type: isEntryTime ? "masuk" : "pulang",
  };
};
