import React, { useState, useEffect, useRef } from "react";
import {
  Scan,
  Shield,
  Camera,
  Truck,
  CheckCircle2,
  AlertOctagon,
  FileText,
  XSquare,
} from "lucide-react";
import { useSocket } from "../../services/SocketProvider";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../hooks/useLanguage";

const getToken = () =>
  localStorage.getItem("logivision_token") ||
  sessionStorage.getItem("logivision_token") ||
  "";

const ScanTab = () => {
  const { emit, feed = [] } = useSocket();
  const { addToast: showToast } = useToast();
  const { t } = useLanguage();

  // Core Flow States
  const [plateDone, setPlateDone] = useState(false);
  const [challanDone, setChallanDone] = useState(false);
  const [loadCheck, setLoadCheck] = useState(null);
  const [scanAnim, setScanAnim] = useState("IDLE"); // IDLE, SCANNING, PARSING, DONE
  const [flowScreen, setFlowScreen] = useState("MAIN"); // MAIN, VERIFIED, MISMATCH

  // Image Data
  const [plateImage, setPlateImage] = useState(null);
  const [challanImage, setChallanImage] = useState(null);
  const [loadPhoto, setLoadPhoto] = useState(null);
  const [plateData, setPlateData] = useState({ plate: "" });
  const [extractedChallanData, setExtractedChallanData] = useState(null);

  // Refs
  const plateInputRef = useRef(null);
  const challanInputRef = useRef(null);
  const loadInputRef = useRef(null);

  const resetFlow = () => {
    setPlateDone(false);
    setChallanDone(false);
    setLoadCheck(null);
    setScanAnim("IDLE");
    setFlowScreen("MAIN");
    setPlateImage(null);
    setChallanImage(null);
    setLoadPhoto(null);
    setPlateData({ plate: "" });
    setExtractedChallanData(null);
  };

  // Step 1: Plate OCR
  const handlePlateFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target.result;
      setPlateImage(imageData);
      setScanAnim("PARSING");
      try {
        const res = await fetch("/api/challans/ocr-plate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ imageUrl: imageData }),
        });
        const result = await res.json();
        if (result.success && result.data.vehicleNo) {
          setPlateData({ plate: result.data.vehicleNo });
          setPlateDone(true);
          setScanAnim("IDLE");
          showToast("Plate Locked: " + result.data.vehicleNo, "success");
        } else throw new Error();
      } catch {
        showToast("Plate Read Failed - Try Again", "error");
        setScanAnim("IDLE");
        setPlateImage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Step 2: Challan OCR
  const handleChallanFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target.result;
      setChallanImage(imageData);
      setScanAnim("PARSING");
      try {
        const res = await fetch("/api/challans/ocr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ imageUrl: imageData }),
        });
        const result = await res.json();
        if (result.success && result.data.truck_number) {
          setExtractedChallanData(result.data);
          setChallanDone(true);
          setScanAnim("IDLE");
          showToast("Challan Data Extracted", "success");
        } else throw new Error();
      } catch {
        showToast("AI Failed to Read Challan - Use Better Lighting", "error");
        setScanAnim("IDLE");
        setChallanImage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEntry = async () => {
    try {
      const entryData = {
        challanId: extractedChallanData.challan_number || "AUTO-GEN",
        vehicleNo: plateData.plate,
        vendorName: extractedChallanData.from,
        destination: extractedChallanData.to,
        goodsDescription: extractedChallanData.goods_description,
        totalWeight: extractedChallanData.weight,
        declaredLoad: extractedChallanData.capacity,
        visualLoad: loadCheck,
        status: "PENDING",
        scan_method: "ocr",
        imageUrl: challanImage,
        vehicleImageUrl: loadPhoto,
      };

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(entryData),
      });
      if ((await res.json()).success) setFlowScreen("VERIFIED");
    } catch (err) {
      showToast("Submission Failed", "error");
    }
  };

  if (flowScreen === "VERIFIED") {
    return (
      <div className="absolute inset-0 bg-[#080C14] z-50 flex flex-col items-center justify-center p-6">
        <CheckCircle2 size={80} className="text-[#0DD9B0] mb-4" />
        <h2 className="text-2xl font-black text-white">ENTRY LOGGED</h2>
        <button
          onClick={resetFlow}
          className="mt-8 bg-[#0DD9B0] text-black px-10 py-4 rounded-2xl font-black"
        >
          NEXT TRUCK
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#080C14] text-white p-5 space-y-6 overflow-y-auto pb-24">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#1E2D45] pb-4">
        <div className="flex items-center gap-2">
          <Shield className="text-[#F59E0B]" size={20} />
          <span className="text-xs font-black tracking-widest">
            GATE_PROTECT_V3
          </span>
        </div>
        <div className="text-[10px] text-[#6B7FA8]">
          {feed.length} SCANS TODAY
        </div>
      </div>

      {/* Step 1 & 2: Scanner Viewfinder Area */}
      <div className="bg-[#0D1421] border border-[#1E2D45] rounded-3xl aspect-video relative overflow-hidden flex items-center justify-center">
        {scanAnim === "PARSING" ? (
          <div className="flex flex-col items-center gap-2 animate-pulse">
            <div className="w-8 h-8 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-mono text-[#F59E0B]">
              NEURAL_PROCESSING...
            </span>
          </div>
        ) : (
          <div className="text-center opacity-40">
            <Camera size={40} className="mx-auto mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Sensors Ready
            </span>
          </div>
        )}
        {plateImage && !challanImage && (
          <img
            src={plateImage}
            className="absolute inset-0 object-cover w-full h-full opacity-60"
          />
        )}
        {challanImage && (
          <img
            src={challanImage}
            className="absolute inset-0 object-cover w-full h-full opacity-60"
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid gap-4">
        <input
          ref={plateInputRef}
          type="file"
          capture="environment"
          className="hidden"
          onChange={handlePlateFileSelect}
        />
        <button
          onClick={() => plateInputRef.current.click()}
          disabled={plateDone}
          className={`h-16 rounded-2xl border-2 font-black transition-all ${plateDone ? "border-[#0DD9B0] bg-[#0DD9B0]/10 text-[#0DD9B0]" : "border-[#1E2D45] bg-[#111827]"}`}
        >
          {plateDone ? `✓ ${plateData.plate}` : "1. SCAN LICENSE PLATE"}
        </button>

        <input
          ref={challanInputRef}
          type="file"
          capture="environment"
          className="hidden"
          onChange={handleChallanFileSelect}
        />
        <button
          onClick={() => challanInputRef.current.click()}
          disabled={!plateDone || challanDone}
          className={`h-16 rounded-2xl border-2 font-black transition-all ${!plateDone ? "opacity-30" : ""} ${challanDone ? "border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]" : "border-[#1E2D45] bg-[#111827]"}`}
        >
          {challanDone ? "✓ CHALLAN EXTRACTED" : "2. SCAN CHALLAN DOC"}
        </button>
      </div>

      {/* Visual Check */}
      <div className="space-y-3">
        <span className="text-[10px] font-black text-[#6B7FA8] uppercase">
          3. Visual Load Verification
        </span>
        <div className="grid grid-cols-3 gap-3">
          {["FULL", "HALF", "EMPTY"].map((opt) => (
            <button
              key={opt}
              onClick={() => setLoadCheck(opt)}
              className={`py-4 rounded-xl border-2 font-black text-xs transition-all ${loadCheck === opt ? "border-[#0DD9B0] bg-[#0DD9B0] text-black" : "border-[#1E2D45] bg-[#0D1421] text-[#3D4F6B]"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Final Submit */}
      {plateDone && challanDone && loadCheck && (
        <button
          onClick={handleSubmitEntry}
          className="w-full py-5 bg-[#0DD9B0] text-black font-black rounded-2xl shadow-lg shadow-[#0DD9B0]/20 animate-bounce"
        >
          FINALIZE & OPEN GATE
        </button>
      )}
    </div>
  );
};

export default ScanTab;
