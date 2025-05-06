"use client";
import { useState, useEffect, useCallback } from "react";

export const useLocation = () => {
  const [locationData, setLocationData] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState(null);
  const [maxRadius, setMaxRadius] = useState(null);
  const [lastCheckTime, setLastCheckTime] = useState(null);

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

  // Use useCallback to avoid recreation of this function on every render
  const checkLocation = useCallback(async () => {
    // Prevent checking again if we've checked recently (within 3 seconds)
    const now = Date.now();
    if (lastCheckTime && now - lastCheckTime < 3000) {
      console.log("Skipping location check, too soon since last check");
      return;
    }
    
    // Set the last check time
    setLastCheckTime(now);
    
    try {
      setLoading(true);
      // Fetch location data from API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/lokasi-presensi`
      );
      const data = await response.json();
      const schoolData = data.data;
      setLocationData(schoolData);

      // Get current position
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });

      const { latitude: userLat, longitude: userLon } = position.coords;
      const schoolLat = parseFloat(schoolData.latitude);
      const schoolLon = parseFloat(schoolData.longitude);
      const radius = parseFloat(schoolData.radius_meter);
      
      // Set the maximum radius
      setMaxRadius(radius);

      const calculatedDistance = calculateDistance(
        userLat,
        userLon,
        schoolLat,
        schoolLon
      );
      
      // Set the distance
      setDistance(calculatedDistance);

      console.log("Distance to school:", calculatedDistance.toFixed(2), "meters");
      console.log("Allowed radius:", radius, "meters");
      console.log("User location:", userLat.toFixed(6), userLon.toFixed(6));
      console.log(
        "School location:",
        schoolLat.toFixed(6),
        schoolLon.toFixed(6)
      );

      const withinRadius = calculatedDistance <= radius;
      console.log("Within radius:", withinRadius);

      setIsWithinRadius(withinRadius);
      setLocationError(null);
    } catch (error) {
      console.error("Error checking location:", error);
      setLocationError(
        error.code === 1
          ? "Izin lokasi ditolak. Mohon aktifkan akses lokasi di browser Anda."
          : "Gagal mendapatkan lokasi. Pastikan GPS aktif dan coba lagi."
      );
      setIsWithinRadius(false);
      setDistance(null);
    } finally {
      setLoading(false);
    }
  }, [lastCheckTime]);

  return {
    locationData,
    locationError,
    isWithinRadius,
    loading,
    checkLocation,
    distance,
    maxRadius
  };
};
