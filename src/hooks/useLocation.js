"use client";
import { useState, useEffect } from "react";

export const useLocation = () => {
  const [locationData, setLocationData] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [loading, setLoading] = useState(true);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const checkLocation = async () => {
    try {
      setLoading(true);
      // Fetch location data from API
      const response = await fetch("http://localhost:1337/api/lokasi-presensi");
      const data = await response.json();
      setLocationData(data.data);

      // Get current position
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });

      const { latitude: userLat, longitude: userLon } = position.coords;
      const distance = calculateDistance(
        userLat,
        userLon,
        parseFloat(data.data.latitude),
        parseFloat(data.data.longitude)
      );

      setIsWithinRadius(distance <= data.data.radius_meter);
      setLocationError(null);
    } catch (error) {
      console.error("Error checking location:", error);
      setLocationError(
        error.code === 1
          ? "Izin lokasi ditolak. Mohon aktifkan akses lokasi di browser Anda."
          : "Gagal mendapatkan lokasi. Pastikan GPS aktif dan coba lagi."
      );
      setIsWithinRadius(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    locationData,
    locationError,
    isWithinRadius,
    loading,
    checkLocation,
  };
};
