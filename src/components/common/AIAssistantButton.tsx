"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { Lightbulb, Heart, Moon } from "lucide-react";

interface AIAssistantButtonProps {
  userType: "student" | "professor";
}

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({
  userType,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isNightTime, setIsNightTime] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const [currentMessage, setCurrentMessage] = useState("👋 How can I help?");
  const [showMessage, setShowMessage] = useState(false);

  // Refs for tracking
  const isBusy = useRef(false);
  const isDragging = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Audio Synthesis
  const playRobotSound = (type: 'hover' | 'click' | 'idea' | 'wake' | 'sleep' | 'drag' | 'message') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.03, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'click') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'idea') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1200, now + 0.1);
        osc.frequency.setValueAtTime(1600, now + 0.2);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'wake') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'sleep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'drag') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'message') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(900, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch {
      // Ignore audio context errors
    }
  };

  // Contextual messages
  const getContextualMessages = useCallback(() => {
    const p = pathname || "";
    if (p.includes('/schedule')) return ["Check your upcoming lectures! 📅", "Don't be late for class!", "Today's schedule is looking busy!"];
    if (p.includes('/grades')) return ["Hope you're proud of your grades! 🌟", "Keep up the excellent work!", "Need help calculating your GPA?"];
    if (p.includes('/attendance')) return ["Consistency is key! 🎯", "Your attendance looks good!", "Remember to mark your presence!"];
    if (p.includes('/exams')) return ["Good luck studying! 📚", "Need any quiz reviews?", "Time to ace those tests!"];
    if (p.includes('/profile')) return ["Looking good today! ✨", "Need to update your settings?", "Your profile is 100% complete!"];
    if (p.includes('/notifications')) return ["You've got mail! 📩", "Check your latest updates.", "Don't miss any announcements!"];
    if (p.includes('/chatbot') || p.includes('/ai-assistant')) return ["I'm right here! 🤖", "Need a deep conversation?", "How can I help you today?"];
    
    if (userType === "student") {
      return [
        "Did you check your schedule today?",
        "Keep up the great work! 🌟",
        "Any new assignments due soon?",
        "Need help reviewing a lecture?",
        "Take a short break if you need it! ☕",
        "The campus is lively today!",
        "Don't forget to stay hydrated! 💧"
      ];
    }
    return [
      "Ready to review some quizzes?",
      "Check your upcoming sessions! 📅",
      "Don't forget to mark attendance.",
      "Need help generating an exam?",
      "Your classes are running smoothly! 🚀",
      "Reviewing student performance?",
      "Hope you're having a productive day!"
    ];
  }, [pathname, userType]);

  // Robot State
  const [robotState, setRobotState] = useState({
    eyeX: 0,
    eyeY: 0,
    leftEyeY: 0,
    rightEyeY: 0,
    eyeScaleY: 1,
    eyeScaleX: 1,
    headRotate: 0,
    bodyY: 0,
    bodyRotate: 0,
    armRotate: 0,
    blink: false,
    winkLeft: false,
    winkRight: false,
    isSpinning: false,
    isShaking: false,
    isSleeping: false,
    isTalking: false,
    showIdea: false,
    showLove: false,
    isGlitching: false,
    isDizzy: false,
    isShocked: false,
  });

  // Time-Awareness
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsNightTime(hour >= 0 && hour < 6); // 12 AM to 6 AM
    };
    checkTime();
    const interval = setInterval(checkTime, 60000); 
    return () => clearInterval(interval);
  }, []);

  // Eye Tracking
  useEffect(() => {
    if (isNightTime || robotState.isSpinning || robotState.isDizzy) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const robotCenterX = rect.left + rect.width / 2;
      const robotCenterY = rect.top + rect.height / 2;
      
      const dx = e.clientX - robotCenterX;
      const dy = e.clientY - robotCenterY;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance < 30) return; // Ignore if hovering over face
      
      const maxEyeMove = 6;
      const moveX = (dx / distance) * maxEyeMove;
      const moveY = (dy / distance) * maxEyeMove * 0.4; 
      
      setRobotState(prev => ({ ...prev, eyeX: moveX, eyeY: moveY }));
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isNightTime, robotState.isSpinning, robotState.isDizzy]);

  // Visibility Control
  useEffect(() => {
    const checkVisibility = () => {
      const saved = localStorage.getItem("ai_assistant_enabled");
      setIsVisible(saved !== "false");
    };
    
    checkVisibility();
    window.addEventListener("ai_assistant_preference_changed", checkVisibility);
    return () => window.removeEventListener("ai_assistant_preference_changed", checkVisibility);
  }, []);

  // Proactive messages timer
  useEffect(() => {
    let hoverInterval: NodeJS.Timeout;

    if (isHovered) {
      setShowMessage(true);
      const messages = getContextualMessages();
      const initialMsg = messages[Math.floor(Math.random() * messages.length)];
      setCurrentMessage(initialMsg);
      
      // Cycle messages while hovering - FASTER
      hoverInterval = setInterval(() => {
        const msgs = getContextualMessages();
        const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
        setCurrentMessage(randomMsg);
      }, 3000);

      return () => {
        clearInterval(hoverInterval);
      };
    } else {
      // Hide message immediately when hover ends, UNLESS it was a proactive one
      // But actually, for better UX, let's just hide it.
      setShowMessage(false);
    }

    const messageInterval = setInterval(() => {
      if (!isBusy.current && Math.random() > 0.3) {
        const messages = getContextualMessages();
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        setCurrentMessage(randomMsg);
        setShowMessage(true);
        setRobotState(prev => ({ ...prev, isTalking: true, armRotate: -15 }));
        playRobotSound('message');
        
        setTimeout(() => {
          setShowMessage(false);
          setRobotState(prev => ({ ...prev, isTalking: false, armRotate: 0 }));
        }, 6000);
      }
    }, 12000); 

    return () => clearInterval(messageInterval);
  }, [isHovered, userType, pathname, getContextualMessages]);


  const resetState = () => {
    setRobotState({
      eyeX: 0,
      eyeY: 0,
      leftEyeY: 0,
      rightEyeY: 0,
      eyeScaleY: 1,
      eyeScaleX: 1,
      headRotate: 0,
      bodyY: 0,
      bodyRotate: 0,
      armRotate: 0,
      blink: false,
      winkLeft: false,
      winkRight: false,
      isSpinning: false,
      isShaking: false,
      isSleeping: false,
      isTalking: false,
      showIdea: false,
      showLove: false,
      isGlitching: false,
      isDizzy: false,
      isShocked: false,
    });
    isBusy.current = false;
  };

  // Idle Animation Loop
  useEffect(() => {
    if (isHovered || isNightTime) {
      if (!isNightTime) resetState();
      return;
    }

    const triggerRandomAction = () => {
      if (isBusy.current) return;

      const choice = Math.random();
      isBusy.current = true;

      if (choice < 0.02) {
        setRobotState((prev) => ({ ...prev, showIdea: true, eyeScaleY: 1.2, armRotate: -30 }));
        playRobotSound('idea');
        setTimeout(() => {
          setRobotState((prev) => ({ ...prev, showIdea: false, eyeScaleY: 1, armRotate: 0 }));
          isBusy.current = false;
        }, 2500);
      } else if (choice < 0.04) {
        setRobotState((prev) => ({ ...prev, showLove: true, bodyY: -5, armRotate: -20 }));
        setTimeout(() => {
          setRobotState((prev) => ({ ...prev, showLove: false, bodyY: 0, armRotate: 0 }));
          isBusy.current = false;
        }, 2500);
      } else if (choice < 0.07) {
        setRobotState((prev) => ({
          ...prev,
          isSleeping: true,
          headRotate: 15,
          eyeScaleY: 0.1,
          armRotate: 10,
        }));
        setTimeout(() => {
          setRobotState((prev) => ({
            ...prev,
            isSleeping: false,
            headRotate: 0,
            eyeScaleY: 1,
            armRotate: 0,
          }));
          isBusy.current = false;
        }, 4500);
      } else if (choice < 0.1) {
        setRobotState((prev) => ({ ...prev, isTalking: true, armRotate: -15, headRotate: -5 }));
        setTimeout(() => {
          setRobotState((prev) => ({ ...prev, isTalking: false, armRotate: 0, headRotate: 0 }));
          isBusy.current = false;
        }, 2500);
      } else if (choice < 0.12) {
        setRobotState((prev) => ({ ...prev, isGlitching: true }));
        setTimeout(() => {
          setRobotState((prev) => ({ ...prev, isGlitching: false }));
          isBusy.current = false;
        }, 300);
      }
      else if (choice < 0.17) {
        setRobotState((prev) => ({ ...prev, isDizzy: true, headRotate: 15, bodyRotate: -5 }));
        setTimeout(() => {
          setRobotState((prev) => ({ ...prev, isDizzy: false, headRotate: 0, bodyRotate: 0 }));
          isBusy.current = false;
        }, 1500);
      } else if (choice < 0.22) {
        setRobotState((prev) => ({
          ...prev,
          isShocked: true,
          isShaking: true,
          armRotate: -45,
          bodyY: -10,
        }));
        setTimeout(() => {
          setRobotState((prev) => ({
            ...prev,
            isShocked: false,
            isShaking: false,
            armRotate: 0,
            bodyY: 0,
          }));
          isBusy.current = false;
        }, 800);
      }
      else if (choice < 0.35) {
        setRobotState((prev) => ({ ...prev, isSpinning: true }));
        setTimeout(() => {
          setRobotState((prev) => ({ ...prev, isSpinning: false }));
          isBusy.current = false;
        }, 1000);
      } else if (choice < 0.45) {
        setRobotState((prev) => ({ ...prev, bodyY: -20, armRotate: -30 }));
        setTimeout(() => {
          setRobotState((prev) => ({ ...prev, bodyY: 0, armRotate: 0 }));
          isBusy.current = false;
        }, 400);
      } else if (choice < 0.55) {
        setRobotState((prev) => ({
          ...prev,
          leftEyeY: -3,
          rightEyeY: 3,
          headRotate: 15,
          armRotate: -10,
        }));
        setTimeout(() => {
          setRobotState((prev) => ({
            ...prev,
            leftEyeY: 0,
            rightEyeY: 0,
            headRotate: 0,
            armRotate: 0,
          }));
          isBusy.current = false;
        }, 1500);
      } else if (choice < 0.65) {
        setRobotState((prev) => ({ ...prev, isShaking: true }));
        setTimeout(() => {
          setRobotState((prev) => ({ ...prev, isShaking: false }));
          isBusy.current = false;
        }, 500);
      } else if (choice < 0.8) {
        const x = (Math.random() > 0.5 ? 1 : -1) * 12;
        setRobotState((prev) => ({ ...prev, headRotate: x / 2 }));
        setTimeout(() => {
          setRobotState((prev) => ({ ...prev, headRotate: -x / 2 }));
          setTimeout(() => {
            setRobotState((prev) => ({ ...prev, headRotate: 0 }));
            isBusy.current = false;
          }, 500);
        }, 500);
      } else {
        setRobotState((prev) => ({ ...prev, blink: true }));
        setTimeout(() => {
          setRobotState((prev) => ({ ...prev, blink: false }));
          setTimeout(() => {
            setRobotState((prev) => ({ ...prev, blink: true }));
            setTimeout(() => {
              setRobotState((prev) => ({ ...prev, blink: false }));
              isBusy.current = false;
            }, 150);
          }, 100);
        }, 150);
      }
    };

    const timeoutId = setTimeout(function run() {
      triggerRandomAction();
      const nextDelay = Math.random() * 4000 + 4000; 
      setTimeout(run, nextDelay);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [isHovered, isNightTime]);

  const handleClick = () => {
    if (isDragging.current) return;
    playRobotSound('click');
    if (userType === "student") {
      router.push("/dashboard/student/ai-assistant");
    } else {
      router.push("/dashboard/professor/chatbot");
    }
  };

  const isActuallySleeping = isNightTime || robotState.isSleeping;
  const isActuallyShocked = robotState.isShocked && !isNightTime;

  const getLedColor = () => {
    if (isActuallySleeping) return "from-indigo-500/20 to-purple-500/20 shadow-indigo-500/10";
    if (robotState.showLove) return "from-red-400 to-pink-500 shadow-red-500/50";
    if (robotState.showIdea) return "from-green-400 to-emerald-500 shadow-emerald-500/50";
    if (robotState.isGlitching || isActuallyShocked) return "from-amber-400 to-orange-500 shadow-orange-500/50";
    if (isHovered) return "from-cyan-400 to-blue-500 shadow-blue-500/50";
    return "from-blue-500 to-indigo-500 shadow-indigo-500/40"; 
  };

  if (!isVisible) return null;

  return (
    <m.div 
      drag
      dragConstraints={{ left: -2000, right: 100, top: -2000, bottom: 100 }}
      dragElastic={0.05}
      dragMomentum={true}
      onDragStart={() => { 
        isDragging.current = true; 
        playRobotSound('wake');
      }}
      onDrag={() => {
        if (Math.random() > 0.8) playRobotSound('drag');
      }}
      onDragEnd={() => { 
        setTimeout(() => { isDragging.current = false; }, 100); 
      }}
      className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end gap-4 w-fit cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
    >
      <AnimatePresence>
        {showMessage && !isActuallySleeping && (
          <m.div
            initial={{ opacity: 0, x: 20, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, x: 10, scale: 0.8 }}
            className="mb-8 mr-2 pointer-events-none origin-bottom-right"
          >
            <div className="bg-white/95 backdrop-blur-md text-gray-800 px-5 py-3 rounded-2xl rounded-br-none shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-indigo-100/50 font-medium text-sm flex items-center gap-3 relative overflow-hidden whitespace-nowrap max-w-[250px] sm:max-w-[300px]">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
              <span className="text-lg leading-none">{isHovered ? "👋" : "💡"}</span> 
              <span className="tracking-wide truncate">{currentMessage}</span>
            </div>
          </m.div>
        )}
        {isActuallySleeping && !isHovered && (
          <m.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.8 }}
            className="mb-8 mr-2 pointer-events-none origin-bottom-right"
          >
            <div className="bg-slate-900/90 backdrop-blur-md text-slate-200 px-4 py-2 rounded-2xl rounded-br-none shadow-xl border border-indigo-500/30 text-sm flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" /> Shh... recharging.
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <m.button
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={() => { setIsHovered(true); playRobotSound('hover'); }}
        onMouseLeave={() => setIsHovered(false)}
        className="relative pointer-events-auto focus:outline-none flex flex-col items-center justify-center scale-50 sm:scale-100 origin-bottom-right w-24"
        style={{ height: '140px' }} 
        animate={{ y: 0 }}
        whileHover={{ scale: 1.1, rotate: -3 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Assistant"
      >
        <m.div
          style={{ willChange: "transform" }}
          animate={{
            y: isHovered ? [0, -10, 0] : isActuallySleeping ? [0, 2, 0] : [0, -6, 0],
          }}
          transition={{
            duration: isActuallySleeping ? 4 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-full h-full flex flex-col items-center justify-end pb-2"
        >
          <m.div
            animate={{
              rotate: isActuallySleeping ? 15 : robotState.headRotate,
              y: robotState.bodyY,
              x: robotState.isShaking || robotState.isGlitching ? [-2, 2, -2, 2, 0] : 0,
              filter: robotState.isGlitching ? "hue-rotate(90deg) contrast(1.5)" : "none",
            }}
            transition={{
              rotate: { type: "spring", stiffness: 200, damping: 20 },
              y: { type: "spring", stiffness: 300, damping: 20 },
              x: { type: "tween", duration: 0.1 },
            }}
            className="relative z-20 flex flex-col items-center"
          >
            {/* Antenna */}
            <m.div
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-gray-300 dark:bg-gray-400 rounded-full origin-bottom"
              animate={{ rotate: isHovered ? [0, 20, -20, 0] : isActuallySleeping ? 45 : [0, 5, -5, 0] }}
              transition={{ duration: isHovered ? 0.2 : 2, repeat: Infinity }}
            >
              <m.div
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white/80 shadow-sm"
                animate={{
                  backgroundColor: isActuallySleeping ? "#4f46e5" : isHovered || robotState.showIdea ? ["#ef4444", "#22c55e", "#ef4444"] : ["#ef4444", "#ff0000", "#ef4444"],
                  scale: isActuallySleeping ? 0.8 : isHovered || robotState.showIdea ? [1, 1.3, 1] : 1,
                  boxShadow: isActuallySleeping ? "none" : "0 0 8px rgba(239, 68, 68, 0.6)"
                }}
                transition={{ duration: isHovered || robotState.showIdea ? 0.5 : 1, repeat: Infinity }}
              />
            </m.div>

            <div className="relative w-24 h-20 bg-white dark:bg-gray-200 rounded-[2.5rem] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3),inset_0_-4px_10px_rgba(0,0,0,0.1)] border-2 border-white/50 dark:border-white/20 overflow-hidden backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent dark:from-white/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-gray-900/95 rounded-3xl shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] flex items-center justify-center gap-3 overflow-hidden border border-gray-700/50">
                <div className="absolute -top-2 -left-2 w-[150%] h-1/2 bg-gradient-to-b from-white/10 to-transparent transform -rotate-12 pointer-events-none" />

                <m.div
                  className="w-3.5 h-5 bg-blue-400"
                  style={{ borderRadius: isHovered || robotState.showLove ? "50% 50% 0 0" : "9999px" }}
                  animate={{
                    x: isHovered ? 0 : robotState.isDizzy ? [0, 5, 0, -5, 0] : robotState.eyeX,
                    y: isHovered ? 0 : robotState.isDizzy ? [5, 0, -5, 0, 5] : robotState.eyeY + robotState.leftEyeY,
                    scaleY: isActuallySleeping || robotState.blink || robotState.winkLeft ? 0.1 : isHovered ? 0.8 : isActuallyShocked ? 1.5 : robotState.eyeScaleY,
                    scaleX: isActuallyShocked ? 1.5 : robotState.eyeScaleX,
                    height: isHovered ? 15 : 20,
                    backgroundColor: isActuallySleeping ? "#4b5563" : robotState.showLove ? "#ef4444" : "#60a5fa",
                    boxShadow: isActuallySleeping ? "none" : robotState.showLove ? "0 0 12px #ef4444" : "0 0 12px #60a5fa",
                  }}
                  transition={{ 
                    type: robotState.isDizzy ? "tween" : "spring", 
                    stiffness: 120, 
                    damping: 25,
                    duration: robotState.isDizzy ? 0.5 : undefined 
                  }}
                />

                <m.div
                  className="w-3.5 h-5 bg-blue-400"
                  style={{ borderRadius: isHovered || robotState.showLove ? "50% 50% 0 0" : "9999px" }}
                  animate={{
                    x: isHovered ? 0 : robotState.isDizzy ? [0, -5, 0, 5, 0] : robotState.eyeX,
                    y: isHovered ? 0 : robotState.isDizzy ? [-5, 0, 5, 0, -5] : robotState.eyeY + robotState.rightEyeY,
                    scaleY: isActuallySleeping || robotState.blink || robotState.winkRight ? 0.1 : isHovered ? 0.8 : isActuallyShocked ? 1.5 : robotState.eyeScaleY,
                    scaleX: isActuallyShocked ? 1.5 : robotState.eyeScaleX,
                    height: isHovered ? 15 : 20,
                    backgroundColor: isActuallySleeping ? "#4b5563" : robotState.showLove ? "#ef4444" : "#60a5fa",
                    boxShadow: isActuallySleeping ? "none" : robotState.showLove ? "0 0 12px #ef4444" : "0 0 12px #60a5fa",
                  }}
                  transition={{ 
                    type: robotState.isDizzy ? "tween" : "spring", 
                    stiffness: 120, 
                    damping: 25,
                    duration: robotState.isDizzy ? 0.5 : undefined 
                  }}
                />

                <m.div
                  className="absolute bottom-2.5 w-4 h-1 bg-blue-400 rounded-full opacity-0"
                  animate={{
                    opacity: isActuallySleeping ? 0 : isHovered || robotState.isTalking ? 1 : 0,
                    scaleX: isHovered ? 1.5 : robotState.isTalking ? [0.5, 1.2, 0.8, 1.5, 0.5] : 0.5,
                    scaleY: robotState.isTalking ? [1, 2, 1, 3, 1] : 1,
                    y: isHovered ? 0 : 5,
                    boxShadow: "0 0 8px #60a5fa"
                  }}
                  transition={{ duration: 0.2, repeat: robotState.isTalking ? Infinity : 0 }}
                />
              </div>
            </div>

            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-3 h-8 bg-gray-300 dark:bg-gray-400 rounded-l-lg border-l-2 border-white/50 shadow-[inset_2px_0_4px_rgba(0,0,0,0.1)]" />
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-3 h-8 bg-gray-300 dark:bg-gray-400 rounded-r-lg border-r-2 border-white/50 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]" />
            

          </m.div>

          <m.div
             animate={{
              rotate: robotState.bodyRotate,
              y: robotState.bodyY,
              x: robotState.isShaking || robotState.isGlitching ? [-1, 1, -1, 1, 0] : 0,
            }}
            transition={{ rotate: { type: "spring", stiffness: 200, damping: 20 }, y: { type: "spring", stiffness: 300, damping: 20 } }}
            className="relative z-10 flex flex-col items-center -mt-1"
          >
            <div className="relative w-16 h-14 bg-white dark:bg-gray-300 rounded-[1.5rem] shadow-[0_8px_15px_-3px_rgba(0,0,0,0.2),inset_0_-4px_8px_rgba(0,0,0,0.1)] border border-white/50 dark:border-white/20 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent dark:from-white/40" />
              <m.div 
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${getLedColor()} flex items-center justify-center shadow-lg transition-colors duration-500`}
              >
                <div className="w-3 h-3 bg-white/80 rounded-full blur-[1px]" />
              </m.div>
              <div className="absolute bottom-2 left-3 right-3 flex justify-between px-1">
                 <div className="w-2 h-1 bg-gray-300 dark:bg-gray-400 rounded-full" />
                 <div className="w-2 h-1 bg-gray-300 dark:bg-gray-400 rounded-full" />
                 <div className="w-2 h-1 bg-gray-300 dark:bg-gray-400 rounded-full" />
              </div>
            </div>

            <m.div 
               className="absolute top-2 -left-3 w-4 h-8 bg-gray-200 dark:bg-gray-400 rounded-full shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)] border border-white/40 origin-top"
               animate={{ rotate: isHovered ? 20 : isActuallySleeping ? 10 : robotState.armRotate }}
               transition={{ type: "spring", stiffness: 200, damping: 15 }}
            />
            <m.div 
               className="absolute top-2 -right-3 w-4 h-8 bg-gray-200 dark:bg-gray-400 rounded-full shadow-[inset_2px_0_4px_rgba(0,0,0,0.1)] border border-white/40 origin-top"
               animate={{ rotate: isHovered ? -20 : isActuallySleeping ? -10 : -robotState.armRotate }}
               transition={{ type: "spring", stiffness: 200, damping: 15 }}
            />
            
            <div className="relative mt-1 flex justify-center w-full">
              {/* Outer Glow */}
              <m.div 
                className="w-12 h-2 rounded-full bg-blue-500/40 dark:bg-blue-400/30 blur-md absolute top-0"
                animate={{ 
                  opacity: isActuallySleeping ? 0.1 : isHovered ? [0.6, 1, 0.6] : [0.3, 0.6, 0.3],
                  scaleX: isActuallySleeping ? 0.7 : isHovered ? [1, 1.2, 1] : [1, 1.1, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              {/* Bright Core */}
              <m.div 
                className="w-6 h-1 rounded-full bg-cyan-200 dark:bg-cyan-100 blur-[1px] absolute top-[2px]"
                animate={{ 
                  opacity: isActuallySleeping ? 0 : isHovered ? [0.8, 1, 0.8] : [0.4, 0.8, 0.4]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </m.div>

          <AnimatePresence>
            {robotState.showIdea && (
              <m.div
                initial={{ opacity: 0, y: 0, scale: 0 }}
                animate={{ opacity: 1, y: -65, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute top-0 left-[50%] -translate-x-1/2 z-50 pointer-events-none"
              >
                <Lightbulb className="w-10 h-10 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
              </m.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isActuallySleeping && (
              <div className="absolute -top-10 right-4 z-50 pointer-events-none">
                {[1, 2, 3].map((i) => (
                  <m.div
                    key={i}
                    initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 0.8, 0], y: -40, x: 20, scale: [0.5, 1.2, 0.8] }}
                    transition={{ duration: 3, delay: i * 0.9, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute text-indigo-300 font-medium italic text-2xl drop-shadow-[0_0_8px_rgba(165,180,252,0.8)]"
                    style={{ right: i * 8, top: i * -6 }}
                  >
                    z
                  </m.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {robotState.showLove && (
              <m.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1.2, y: -60 }}
                exit={{ opacity: 0, y: -80 }}
                className="absolute top-0 left-[50%] -translate-x-1/2 z-50 pointer-events-none"
              >
                <Heart className="w-8 h-8 text-red-500 fill-red-500 drop-shadow-xl" />
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      </m.button>
    </m.div>
  );
};
