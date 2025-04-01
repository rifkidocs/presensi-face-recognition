"use client";
import React, { useState } from "react";

const LoginForm = ({ onLogin }) => {
  const [role, setRole] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setError("");
  };

  const handleStudentIdSubmit = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) {
      setError("Nomor Induk Siswa tidak boleh kosong");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:1337/api/siswas?populate=*&filters[nomor_induk_siswa][$eq]=${studentId}`
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data siswa");
      }

      const data = await response.json();

      if (data.data.length === 0) {
        setError("Siswa dengan nomor induk tersebut tidak ditemukan");
        setLoading(false);
        return;
      }

      // Pass student data to parent component
      onLogin({
        role: "siswa",
        data: data.data[0],
      });
    } catch (error) {
      console.error("Error fetching student data:", error);
      setError("Terjadi kesalahan saat mengambil data siswa");
    } finally {
      setLoading(false);
    }
  };

  const handleOtherRoleSubmit = () => {
    // For now, just pass the role without additional data
    onLogin({
      role: role,
      data: null,
    });
  };

  return (
    <div className="bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Sistem Presensi
      </h2>

      {!role ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white mb-4 text-center">
            Pilih Peran Anda
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => handleRoleSelect("siswa")}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              Siswa
            </button>
            <button
              onClick={() => handleRoleSelect("guru")}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              Guru
            </button>
            <button
              onClick={() => handleRoleSelect("pegawai")}
              className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              Pegawai
            </button>
          </div>
        </div>
      ) : role === "siswa" ? (
        <div>
          <button
            onClick={() => setRole("")}
            className="text-gray-400 hover:text-white mb-4 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Kembali
          </button>

          <h3 className="text-lg font-medium text-white mb-4">
            Masukkan Nomor Induk Siswa
          </h3>
          <form onSubmit={handleStudentIdSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Nomor Induk Siswa"
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? "Memproses..." : "Lanjutkan"}
            </button>
          </form>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setRole("")}
            className="text-gray-400 hover:text-white mb-4 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Kembali
          </button>

          <h3 className="text-lg font-medium text-white mb-4">
            Lanjutkan sebagai {role === "guru" ? "Guru" : "Pegawai"}
          </h3>
          <button
            onClick={handleOtherRoleSubmit}
            className={`w-full py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center text-white ${role === "guru" ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"}`}
          >
            Lanjutkan ke Pengenalan Wajah
          </button>
        </div>
      )}
    </div>
  );
};

export default LoginForm;