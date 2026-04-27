import React from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation2 } from "lucide-react";

interface LocationFormData {
  location: {
    name: string;
    latitude: string | number;
    longitude: string | number;
  };
  security: {
    isLocationRequired: boolean;
  };
}

interface LocationStepProps {
  formData: LocationFormData;
  handleInputChange: (field: string, value: string | boolean | number) => void;
  showError: (msg: string) => void;
  showWarning: (msg: string) => void;
  info: (msg: string) => void;
  success: (msg: string) => void;
}

const LocationStep: React.FC<LocationStepProps> = ({
  formData,
  handleInputChange,
  showError,
  showWarning,
  info,
  success,
}) => {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl border border-white/40 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
             <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
             </div>
             Location Settings | إعدادات الموقع
          </h2>
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-800">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Required</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.security.isLocationRequired}
                onChange={(e) =>
                  handleInputChange("security.isLocationRequired", e.target.checked)
                }
                className="sr-only peer"
                aria-label="Require location geofencing"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500 shadow-sm"></div>
            </label>
          </div>
        </div>

        <div className={`space-y-8 transition-all duration-500 ${!formData.security.isLocationRequired ? "opacity-40 grayscale pointer-events-none scale-[0.98]" : ""}`}>
          <div className="relative group">
            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
              Location Name / Venue
            </label>
            <input
              type="text"
              value={formData.location.name}
              onChange={(e) => handleInputChange("location.name", e.target.value)}
              placeholder="e.g. Building A, Room 101"
              className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium hover:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                Latitude
              </label>
              <input
                type="number"
                value={formData.location.latitude}
                onChange={(e) => handleInputChange("location.latitude", e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                Longitude
              </label>
              <input
                type="number"
                value={formData.location.longitude}
                onChange={(e) => handleInputChange("location.longitude", e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              type="button"
              onClick={async () => {
                if (!navigator.geolocation) {
                  showError("Geolocation is not supported by your browser");
                  return;
                }

                const getAccuratePosition = (
                  options: PositionOptions,
                  targetAccuracy = 50,
                  timeoutMs = 15000,
                ): Promise<GeolocationPosition> => {
                  return new Promise((resolve, reject) => {
                    let bestPosition: GeolocationPosition | null = null;
                    info("Locating... Please wait up to 15s for best signal.");

                    const watchId = navigator.geolocation.watchPosition(
                      (pos) => {
                        if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
                          bestPosition = pos;
                        }
                        if (pos.coords.accuracy <= targetAccuracy) {
                          navigator.geolocation.clearWatch(watchId);
                          resolve(pos);
                        }
                      },
                      (err) => {
                        console.warn("GPS Watch Error:", err);
                      },
                      options,
                    );

                    setTimeout(() => {
                      navigator.geolocation.clearWatch(watchId);
                      if (bestPosition) {
                        resolve(bestPosition);
                      } else {
                        reject(new Error("Timeout: Could not get any location"));
                      }
                    }, timeoutMs);
                  });
                };

                try {
                  const pos = await getAccuratePosition(
                    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
                    50,
                    15000,
                  );

                  handleInputChange("location.latitude", pos.coords.latitude);
                  handleInputChange("location.longitude", pos.coords.longitude);

                  const acc = Math.round(pos.coords.accuracy);
                  if (acc > 2000) {
                    showWarning(`Weak Signal (${acc}m). IP-based location confirmed.`);
                  } else if (acc > 100) {
                    showWarning(`Location set, accuracy is low (${acc}m).`);
                  } else {
                    success(`Location updated (Accuracy: ${acc}m)`);
                  }
                } catch {
                  showError("Failed to get location.");
                }
              }}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 group"
            >
              <Navigation2 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> 
              Use Current Location | موقعي الحالي
            </button>

            {formData.location.latitude && formData.location.longitude && (
              <a
                href={`https://www.google.com/maps?q=${formData.location.latitude},${formData.location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-all flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" /> View on Map
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LocationStep;
