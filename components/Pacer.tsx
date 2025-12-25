import React, { useEffect, useState, useRef } from 'react';
import { PacerPhase } from '../types';
import { Utensils, AlertCircle, CheckCircle, Pause } from 'lucide-react';

interface PacerProps {
  targetChews: number;
  onBiteCompleted: () => void;
  isActive: boolean;
}

const Pacer: React.FC<PacerProps> = ({ targetChews, onBiteCompleted, isActive }) => {
  const [phase, setPhase] = useState<PacerPhase>('PREPARE');
  const [counter, setCounter] = useState(0);
  const [instruction, setInstruction] = useState("准备");

  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setPhase('PREPARE');
      setInstruction("暂停中");
      setCounter(0);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const runCycle = () => {
      // 1. GREEN LIGHT: Prepare / Bite
      setPhase('BITE');
      setInstruction("进食许可：吃一口");
      setCounter(0);
      
      timerRef.current = window.setTimeout(() => {
        // 2. RED LIGHT: Chew (Strict enforcement)
        setPhase('CHEW');
        setInstruction("红灯：严禁吞咽！咀嚼中...");
        
        let currentCount = 0;
        // Faster chewing rhythm for count up
        intervalRef.current = window.setInterval(() => {
          currentCount++;
          setCounter(currentCount);
          if (currentCount >= targetChews) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            // 3. GREEN LIGHT: Swallow
            setPhase('SWALLOW');
            setInstruction("绿灯：可以吞咽");
            onBiteCompleted();
            
            timerRef.current = window.setTimeout(() => {
              // 4. REST (Optional small pause)
              setPhase('REST');
              setInstruction("放下餐具，感受饱腹感");
               timerRef.current = window.setTimeout(() => {
                  runCycle(); // Loop
               }, 4000); 
            }, 2000); 
          }
        }, 600); // 0.6s per chew visual
        
      }, 3000); // 3s allowed to take the bite
    };

    runCycle();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, targetChews]);

  const getVisuals = () => {
    switch (phase) {
      case 'BITE': 
        return {
            bg: "bg-green-500",
            icon: <Utensils className="w-16 h-16 text-white" />,
            status: "安全区"
        };
      case 'CHEW': 
        return {
            bg: "bg-red-600 animate-pulse",
            icon: <div className="text-5xl font-bold text-white font-mono">{counter}</div>,
            status: "警告：咀嚼中"
        };
      case 'SWALLOW': 
        return {
            bg: "bg-green-500",
            icon: <CheckCircle className="w-16 h-16 text-white" />,
            status: "通过"
        };
      case 'REST': 
        return {
            bg: "bg-amber-400",
            icon: <Pause className="w-12 h-12 text-white" />,
            status: "信号延迟中..."
        };
      default: 
        return {
            bg: "bg-gray-400",
            icon: <Pause className="w-12 h-12 text-white" />,
            status: "准备"
        };
    }
  };

  const visual = getVisuals();

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 w-full">
      
      {/* Traffic Light Container */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-full blur-xl opacity-40 transition-colors duration-500 ${visual.bg}`} />
        
        {/* Main Light */}
        <div className={`relative w-56 h-56 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border-8 border-white/20 ${visual.bg}`}>
          {visual.icon}
        </div>
      </div>

      <div className="text-center space-y-2 px-6">
        <div className="text-sm font-bold tracking-widest uppercase text-gray-400 mb-2">{visual.status}</div>
        <h2 className="text-2xl font-bold text-gray-800 transition-all">{instruction}</h2>
        {phase === 'CHEW' && (
           <p className="text-red-500 font-bold mt-2">目标：{targetChews} 次</p>
        )}
      </div>
    </div>
  );
};

export default Pacer;