import React from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation2 } from "lucide-react";

interface LocationStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
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
      <div className="bg-white dark:bg-cardDark rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Location Settings
          </h2>
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </label>
        </div>

        <div className={`space-y-4 transition-opacity ${!formData.security.isLocationRequired ? "opacity-50 pointer-events-none" : ""}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location Name
            </label>
            <input
              type="text"
              value={formData.location.name}
              onChange={(e) => handleInputChange("location.name", e.target.value)}
              placeholder="e.g. Building A, Room 101"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Latitude
              </label>
              <input
                type="number"
                value={formData.location.latitude}
                onChange={(e) => handleInputChange("location.latitude", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Longitude
              </label>
              <input
                type="number"
                value={formData.location.longitude}
                onChange={(e) => handleInputChange("location.longitude", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

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
              } catch (error) {
                showError("Failed to get location.");
              }
            }}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <MapPin className="w-4 h-4" /> Use Current Location
          </button>

          {formData.location.latitude && formData.location.longitude && (
            <a
              href={`https://www.google.com/maps?q=${formData.location.latitude},${formData.location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 ml-4"
            >
              <Navigation2 className="w-4 h-4" /> View on Map
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LocationStep;
