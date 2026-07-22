import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, X, Image as ImageIcon, Link, AlertCircle, CheckCircle2 } from "lucide-react";

interface InstitutionImageUploaderProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  maxSizeMB?: number;
  type: "logo" | "background";
}

export const InstitutionImageUploader: React.FC<InstitutionImageUploaderProps> = ({
  label,
  description,
  value,
  onChange,
  maxSizeMB = 15,
  type
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(!value.startsWith("data:"));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (base64Str: string, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Logos are preferred to be PNG if possible, or high quality JPEG
          const format = type === "logo" ? "image/png" : "image/jpeg";
          resolve(canvas.toDataURL(format, quality));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  const processFile = (file: File) => {
    setErrorMsg(null);

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMsg(`Image is too large. Max allowed size is ${maxSizeMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const rawBase64 = reader.result as string;
        // Optimize resolution & size depending on image type
        const width = type === "logo" ? 400 : 1600;
        const height = type === "logo" ? 400 : 1200;
        const quality = type === "logo" ? 0.85 : 0.75;
        
        const optimizedBase64 = await compressImage(rawBase64, width, height, quality);
        onChange(optimizedBase64);
        setShowUrlInput(false);
      } catch (err) {
        console.error("Image compression failed:", err);
        setErrorMsg("Failed to compress and optimize the image. Please try another one.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange("");
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isBase64 = value.startsWith("data:");

  return (
    <div className="space-y-3 bg-white border border-slate-100 rounded-2xl p-4.5 shadow-3xs hover:shadow-2xs transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5">
        <div>
          <h4 className="text-xs font-bold text-slate-700 tracking-tight flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4 text-indigo-500 shrink-0" />
            {label}
          </h4>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-1.5 self-start">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all flex items-center gap-1 ${
              showUrlInput 
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            }`}
          >
            <Link className="h-2.5 w-2.5" />
            <span>{showUrlInput ? "Dropzone Mode" : "Paste URL Link"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
        {/* Upload Dropzone / URL Input (Left or Main column) */}
        <div className={`sm:col-span-8 flex flex-col justify-center min-h-[110px]`}>
          <AnimatePresence mode="wait">
            {showUrlInput ? (
              <motion.div
                key="url-input"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <label className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                  Paste Direct Web Image Address URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={isBase64 ? "" : value}
                    onChange={(e) => {
                      onChange(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder={
                      type === "logo" 
                        ? "https://example.com/assets/logo.png" 
                        : "https://images.unsplash.com/photo-example"
                    }
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none placeholder:text-slate-400 shadow-3xs"
                  />
                  {value && !isBase64 && (
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {isBase64 && (
                  <p className="text-[9px] text-amber-600 font-bold leading-relaxed">
                    ⚠ Clear the current custom uploaded image first to specify an external link URL.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[110px] group ${
                  isDragActive
                    ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]"
                    : "border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-slate-50/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className={`h-6 w-6 mb-1.5 transition-transform duration-300 ${
                  isDragActive ? "text-indigo-600 scale-110" : "text-slate-400 group-hover:text-indigo-500 group-hover:-translate-y-0.5"
                }`} />
                <span className="text-xs font-extrabold text-indigo-600">
                  {isDragActive ? "Drop the image here" : "Click to Upload or Drag & Drop"}
                </span>
                <span className="text-[9px] text-slate-400 mt-1 font-mono uppercase tracking-widest">
                  PNG, JPG, WEBP • Max {maxSizeMB}MB
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Thumbnail Preview Area (Right Column) */}
        <div className="sm:col-span-4 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-3 relative overflow-hidden min-h-[110px]">
          {value ? (
            <div className="relative group w-full h-full flex flex-col items-center justify-center">
              <div className="relative">
                <img
                  src={value}
                  alt={`${label} Preview`}
                  className={`rounded-lg object-contain bg-white shadow-3xs max-h-[80px] transition-all duration-300 ${
                    type === "logo" 
                      ? "w-16 h-16 p-1.5" 
                      : "w-28 h-16 border border-slate-150 filter saturate-[1.1] brightness-[0.95]"
                  }`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to broken image state
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop";
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full p-1 shadow-sm cursor-pointer transition-all flex items-center justify-center"
                  title={`Remove ${label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="mt-2 text-center w-full max-w-full">
                <span className="text-[8px] text-emerald-600 font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 truncate">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {isBase64 ? "Custom Blob File" : "Remote Live Link"}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 space-y-1">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mx-auto">
                <ImageIcon className="h-5 w-5 text-slate-400" />
              </div>
              <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                No Preview
              </span>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
