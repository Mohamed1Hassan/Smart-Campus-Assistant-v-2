import React from "react";
import { motion } from "framer-motion";
import { Camera, Smartphone, Shield } from "lucide-react";

interface SecurityStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
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
      <div className="bg-white dark:bg-cardDark rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
          Security Measures
        </h2>

        <div className="space-y-6">
          {securityFeatures.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-gray-600 shadow-sm">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SecurityStep;
