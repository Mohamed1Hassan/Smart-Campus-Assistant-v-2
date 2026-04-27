import React from "react";
import { motion } from "framer-motion";
import { Camera, Smartphone, Shield } from "lucide-react";

interface SecurityFormData {
  security: {
    isPhotoRequired: boolean;
    isDeviceCheckRequired: boolean;
    fraudDetectionEnabled: boolean;
  };
}

interface SecurityStepProps {
  formData: SecurityFormData;
  handleInputChange: (field: string, value: boolean) => void;
}

const SecurityStep: React.FC<SecurityStepProps> = ({
  formData,
  handleInputChange,
}) => {
  const securityFeatures = [
    {
      key: "isPhotoRequired",
      label: "Require Photo Verification",
      icon: Camera,
      desc: "Students must take a selfie to check in",
    },
    {
      key: "isDeviceCheckRequired",
      label: "Device Fingerprinting",
      icon: Smartphone,
      desc: "Prevent checking in from multiple accounts on one device",
    },
    {
      key: "fraudDetectionEnabled",
      label: "AI Fraud Detection",
      icon: Shield,
      desc: "Analyze patterns to detect suspicious behavior",
    },
  ];

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl border border-white/40 dark:border-gray-700/50">
        <h2 className="text-xl font-black mb-8 text-gray-900 dark:text-white flex items-center gap-3">
           <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <ShieldIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
           </div>
           Security Measures | إجراءات الأمان
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {securityFeatures.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-5 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.desc}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(
                    formData.security[item.key as keyof typeof formData.security]
                  )}
                  onChange={(e) =>
                    handleInputChange(`security.${item.key}`, e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600 shadow-sm"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SecurityStep;
