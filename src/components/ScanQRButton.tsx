import { QrCode } from "lucide-react";

export default function ScanQRButton() {
  return (
    <button className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95">
      <QrCode className="w-5 h-5" />
      <span>Scan QR</span>
    </button>
  );
}
