import React, { useState, useEffect, useRef } from "react";
import { Clock, AlertTriangle, ShieldAlert } from "lucide-react";

interface ExamTimerProps {
  initialSeconds: number;
  totalDurationSeconds: number;
  onTimeout: () => void;
  onTick?: (secondsLeft: number) => void;
}

export default function ExamTimer({
  initialSeconds,
  totalDurationSeconds,
  onTimeout,
  onTick
}: ExamTimerProps) {
  // Use a ref to store callbacks to prevent stale state captures in the interval
  const callbacksRef = useRef({ onTimeout, onTick });
  useEffect(() => {
    callbacksRef.current = { onTimeout, onTick };
  }, [onTimeout, onTick]);

  // Keep track of remaining seconds
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  
  // Track target timestamp when this timer should expire to prevent background drift
  const targetTimeRef = useRef<number>(Date.now() + initialSeconds * 1000);
  
  // Reset the target time if the initialSeconds changes (e.g. starting a new exam)
  useEffect(() => {
    setSecondsLeft(initialSeconds);
    targetTimeRef.current = Date.now() + initialSeconds * 1000;
  }, [initialSeconds]);

  useEffect(() => {
    let intervalId: any = null;

    const checkTimer = () => {
      const now = Date.now();
      const remainingMs = targetTimeRef.current - now;
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));
      
      setSecondsLeft(remainingSecs);
      
      if (callbacksRef.current.onTick) {
        callbacksRef.current.onTick(remainingSecs);
      }

      if (remainingSecs <= 0) {
        if (intervalId) {
          clearInterval(intervalId);
        }
        callbacksRef.current.onTimeout();
      }
    };

    // Run initial check
    checkTimer();

    // Set interval to tick frequently for responsive visual updates
    intervalId = setInterval(checkTimer, 200);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [initialSeconds]);

  // Calculations for percent and colors
  const pctRemaining = totalDurationSeconds > 0 
    ? Math.min(100, Math.max(0, (secondsLeft / totalDurationSeconds) * 100))
    : 100;

  const isCritical = secondsLeft < 300; // < 5 minutes
  const isWarning = secondsLeft < totalDurationSeconds * 0.25 && !isCritical; // < 25% duration

  // Format visual digital clock string
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    
    const parts = [];
    if (h > 0) parts.push(h.toString().padStart(2, "0"));
    parts.push(m.toString().padStart(2, "0"));
    parts.push(s.toString().padStart(2, "0"));
    
    return parts.join(":");
  };

  // SVG ring parameters
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pctRemaining / 100) * circumference;

  // Determine theme styling
  let progressColor = "stroke-emerald-500";
  let badgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
  let pulseClass = "";

  if (isCritical) {
    progressColor = "stroke-rose-500";
    badgeBg = "bg-rose-50 text-rose-700 border-rose-200";
    pulseClass = "animate-pulse";
  } else if (isWarning) {
    progressColor = "stroke-amber-500";
    badgeBg = "bg-amber-50 text-amber-700 border-amber-200";
  }

  return (
    <div 
      className={`flex items-center space-x-3 px-4 py-2 rounded-2xl border transition-all duration-300 ${badgeBg} ${pulseClass}`}
      id="exam-countdown-timer-module"
    >
      {/* SVG Circular Progress Loader */}
      <div className="relative flex items-center justify-center w-12 h-12 flex-shrink-0">
        <svg className="w-12 h-12 transform -rotate-90">
          {/* Background circle track */}
          <circle 
            cx="24" 
            cy="24" 
            r={radius} 
            className="stroke-slate-200/60" 
            strokeWidth="3.5" 
            fill="transparent" 
          />
          {/* Dynamic remaining time ring */}
          <circle 
            cx="24" 
            cy="24" 
            r={radius} 
            className={`transition-all duration-300 ease-out ${progressColor}`}
            strokeWidth="3.5" 
            fill="transparent" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute">
          {isCritical ? (
            <ShieldAlert className="h-4 w-4 text-rose-500 animate-bounce" />
          ) : isWarning ? (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          ) : (
            <Clock className="h-4 w-4 text-emerald-500" />
          )}
        </span>
      </div>

      {/* Numerical Digits */}
      <div className="flex flex-col select-none">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400">
          {isCritical ? "CRITICAL TIMER" : isWarning ? "TIME WARNING" : "TIME REMAINING"}
        </span>
        <span className="font-mono font-black text-xl leading-none tracking-tight">
          {formatTime(secondsLeft)}
        </span>
      </div>

      {/* Visual Indicator of Percent */}
      <div className="hidden sm:flex flex-col text-right pl-2 border-l border-slate-200/60 h-8 justify-center">
        <span className="text-[9px] font-bold text-slate-400 font-mono">PROGRESS</span>
        <span className="text-xs font-black font-mono">{Math.round(pctRemaining)}%</span>
      </div>
    </div>
  );
}
