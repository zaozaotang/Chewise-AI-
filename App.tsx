import React, { useState, useRef, useEffect } from 'react';
import { Play, StopCircle, Zap, Shield, Brain, Activity, Camera, Share, Download, X } from 'lucide-react';
import { AppView, FoodAnalysis, MealSession } from './types';
import { analyzeFoodImage } from './services/geminiService';
import Pacer from './components/Pacer';

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  
  // Data
  const [foodAnalysis, setFoodAnalysis] = useState<FoodAnalysis | null>(null);
  const [session, setSession] = useState<MealSession | null>(null);
  
  // Session Runtime
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bitesTaken, setBitesTaken] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Satiety Simulator (20 min goal)
  const SATIETY_GOAL_SECONDS = 20 * 60; 
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerInterval = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- Effects ---
  
  // Check for PWA install status
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // If on mobile browser and not installed, show prompt
    if (isMobile && !isStandalone) {
      // Delay slightly to not annoy immediately
      setTimeout(() => setShowInstallPrompt(true), 3000);
    }
  }, []);

  useEffect(() => {
    if (view === AppView.EATING_SESSION && !isPaused) {
      timerInterval.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerInterval.current) clearInterval(timerInterval.current);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [view, isPaused]);

  // --- Handlers ---

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleStartCamera = async () => {
    setView(AppView.CAMERA_ANALYSIS);
    setCameraError(null);
    try {
      // Try environment facing first, fall back to any if failed (for desktop support)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
      } catch (e) {
        console.warn("Environment camera not found, trying user camera", e);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
      }
      
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("无法访问相机。正在启动演示模式...");
      setTimeout(() => {
          handleAnalyzeMock(); 
      }, 1500);
    }
  };

  const handleAnalyzeMock = async () => {
      setCameraError(null);
      setIsLoading(true);
      setTimeout(() => {
          setFoodAnalysis({
              foodName: "红烧肉饭 (演示)",
              calories: 850,
              textureLevel: "Hard",
              recommendedChews: 45,
              fatShieldTip: "高热量预警：必须彻底嚼碎以减少脂肪堆积！"
          });
          setIsLoading(false);
          stopCamera();
          setView(AppView.MEAL_PREP);
      }, 1500);
  }

  const handleCaptureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsLoading(true);
    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const base64Data = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
      
      stopCamera();

      const analysis = await analyzeFoodImage(base64Data);
      setFoodAnalysis(analysis);
      setIsLoading(false);
      setView(AppView.MEAL_PREP);
    }
  };

  const startSession = () => {
    setElapsedTime(0);
    setBitesTaken(0);
    setIsPaused(false);
    setView(AppView.EATING_SESSION);
  };

  const endSession = () => {
    const duration = elapsedTime;
    const bites = bitesTaken;

    setSession({
      durationSeconds: duration,
      totalBites: bites,
      averageChewsPerBite: foodAnalysis?.recommendedChews || 20,
      timestamp: Date.now()
    });
    
    setView(AppView.SUMMARY);
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- Render Functions ---

  const renderDashboard = () => (
    <div className="flex flex-col h-full bg-slate-50 p-6 space-y-8 overflow-y-auto">
      <header className="pt-8">
        <div className="flex items-center gap-2 mb-1">
            <Shield className="text-blue-600 w-8 h-8" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SlimChew AI</h1>
        </div>
        <p className="text-slate-500 text-sm">纤体慢嚼 · 脂肪防御系统已就绪</p>
      </header>

      <section className="flex-grow space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">减脂数据闭环</h3>
                <Activity className="text-green-500 w-5 h-5" />
            </div>
            <div className="h-32 bg-slate-50 rounded-lg flex items-end justify-between p-4 px-6 gap-2">
                {[40, 60, 45, 80, 70, 90, 85].map((h, i) => (
                    <div key={i} className="w-2 bg-blue-500 rounded-t-sm" style={{ height: `${h}%`, opacity: 0.5 + (i/14) }}></div>
                ))}
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">咀嚼次数增加与体重下降呈正相关</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <span className="text-xs font-bold text-blue-400">平均每口咀嚼</span>
                <p className="text-2xl font-bold text-blue-700">28次</p>
            </div>
             <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <span className="text-xs font-bold text-green-400">拦截生吞次数</span>
                <p className="text-2xl font-bold text-green-700">142次</p>
            </div>
        </div>
      </section>

      <button 
        onClick={handleStartCamera}
        className="w-full bg-slate-900 text-white py-5 rounded-2xl text-lg font-bold shadow-xl shadow-slate-300 hover:bg-black transition-all flex items-center justify-center space-x-2 shrink-0"
      >
        <Camera className="w-5 h-5" />
        <span>激活脂肪防御盾</span>
      </button>
    </div>
  );

  const renderCamera = () => (
    <div className="flex flex-col h-full bg-black relative">
       {(isLoading || cameraError) && (
           <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-white p-6 text-center">
               {isLoading ? (
                   <>
                       <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                       <p className="text-lg font-medium">AI 正在扫描热量与质地...</p>
                       <p className="text-sm text-gray-400 mt-2">计算咀嚼汇率中</p>
                   </>
               ) : (
                   <p className="text-red-400">{cameraError}</p>
               )}
           </div>
       )}
       
       <video ref={videoRef} autoPlay playsInline muted className="h-full object-cover w-full opacity-80" />
       <canvas ref={canvasRef} className="hidden" />
       
       {/* Scanner Overlay */}
       <div className="absolute inset-0 border-[32px] border-black/50 pointer-events-none">
           <div className="w-full h-full border-2 border-blue-400/50 relative">
               <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
               <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
               <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
               <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
           </div>
       </div>

       <div className="absolute bottom-0 w-full p-8 flex justify-center items-center bg-gradient-to-t from-black via-black/80 to-transparent">
          {!isLoading && !cameraError && (
              <button 
                onClick={handleCaptureAndAnalyze}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)]"
              >
                <div className="w-16 h-16 bg-slate-900 rounded-full border-4 border-blue-500" />
              </button>
          )}
       </div>
    </div>
  );

  const renderMealPrep = () => (
    <div className="flex flex-col h-full p-6 bg-slate-50 overflow-y-auto">
      <div className="mt-8 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-blue-600 fill-blue-100" /> 
            脂肪防御盾已激活
        </h2>
      </div>
      
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
        <div>
           <span className="text-xs font-bold text-slate-400 uppercase">识别目标</span>
           <p className="text-xl font-bold text-slate-900 mt-1">{foodAnalysis?.foodName}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
             <div>
                <span className="text-xs font-bold text-slate-400 uppercase">预估热量</span>
                <p className="text-lg font-mono font-bold text-orange-600">{foodAnalysis?.calories} kcal</p>
             </div>
             <div>
                <span className="text-xs font-bold text-slate-400 uppercase">质地密度</span>
                <p className="text-lg font-bold text-slate-700">{foodAnalysis?.textureLevel}</p>
             </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-600">计算汇率</span>
                <span className="text-3xl font-black text-blue-600">{foodAnalysis?.recommendedChews} <span className="text-base text-slate-400 font-normal">次/一口</span></span>
            </div>
            <p className="text-xs text-slate-400">高热量 + 高密度 = 强制高频咀嚼</p>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 p-5 rounded-2xl border border-blue-100">
          <p className="text-blue-800 font-medium text-sm leading-relaxed">
             <Zap className="inline w-4 h-4 mr-1 text-blue-600" /> 
             {foodAnalysis?.fatShieldTip}
          </p>
      </div>

      <div className="mt-auto pt-6">
        <button 
            onClick={startSession}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl text-lg font-bold shadow-lg hover:scale-[1.02] transition-transform"
        >
            开始防御进食
        </button>
      </div>
    </div>
  );

  const renderEatingSession = () => {
    const satietyPercent = Math.min((elapsedTime / SATIETY_GOAL_SECONDS) * 100, 100);
    
    return (
    <div className="flex flex-col h-full bg-slate-100 relative overflow-hidden">
       {/* Top Bar: Satiety Simulator */}
       <div className="bg-white p-4 pb-6 shadow-sm z-10 border-b border-slate-200 shrink-0">
           <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-2">
                   <Brain className="w-5 h-5 text-purple-500" />
                   <span className="text-xs font-bold text-slate-500 uppercase">大脑饱腹信号进度</span>
               </div>
               <span className="text-xs font-mono text-slate-400">{Math.floor(satietyPercent)}%</span>
           </div>
           <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-1000 ease-linear"
                 style={{ width: `${satietyPercent}%` }}
               />
           </div>
           <p className="text-[10px] text-slate-400 mt-2 text-center">
               信号还在传输中，请不要被胃部的假性饥饿欺骗。
           </p>
       </div>

       {/* Pacer: Anti-Gulp Interceptor */}
       <div className="flex-grow flex flex-col justify-center overflow-y-auto">
           <Pacer 
             targetChews={foodAnalysis?.recommendedChews || 30} 
             isActive={!isPaused}
             onBiteCompleted={() => setBitesTaken(prev => prev + 1)}
           />
       </div>

       {/* Bottom Controls */}
       <div className="p-6 flex justify-between items-center bg-white border-t border-slate-200 shrink-0">
           <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase">当前耗时</span>
              <span className="text-2xl font-mono font-bold text-slate-800">{formatTime(elapsedTime)}</span>
           </div>
           
           <div className="flex gap-4">
                <button 
                    onClick={() => setIsPaused(!isPaused)}
                    className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border border-slate-200"
                >
                    {isPaused ? <Play className="ml-1" /> : <span className="font-bold text-xs">暂停</span>}
                </button>
                <button 
                    onClick={endSession} 
                    className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 border border-red-100"
                >
                    <StopCircle />
                </button>
           </div>
       </div>
    </div>
    );
  };

  const renderSummary = () => (
    <div className="flex flex-col h-full p-6 text-center justify-center space-y-8 bg-slate-50 overflow-y-auto">
        <div>
            <div className="inline-block p-4 bg-green-100 rounded-full mb-6">
                <Shield className="w-16 h-16 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">防御成功</h2>
            <p className="text-slate-500 mt-2">你成功阻断了快速进食带来的脂肪堆积风险。</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">本次咀嚼</p>
                    <p className="text-3xl font-black text-slate-800">{session?.totalBites! * session?.averageChewsPerBite!}</p>
                    <p className="text-xs text-green-500 mt-1">次肌肉运动</p>
                </div>
                <div>
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">用餐时长</p>
                    <p className="text-3xl font-black text-slate-800">{formatTime(session?.durationSeconds || 0)}</p>
                    <p className="text-xs text-slate-400 mt-1">分钟</p>
                </div>
            </div>
        </div>

        <button 
          onClick={() => setView(AppView.DASHBOARD)}
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg shrink-0"
        >
            返回首页
        </button>
    </div>
  );

  const getActiveView = () => {
    switch (view) {
      case AppView.CAMERA_ANALYSIS: return renderCamera();
      case AppView.MEAL_PREP: return renderMealPrep();
      case AppView.EATING_SESSION: return renderEatingSession();
      case AppView.SUMMARY: return renderSummary();
      default: return renderDashboard();
    }
  };

  // --- Main Render with Desktop Wrapper ---
  return (
    <div className="min-h-[100dvh] bg-slate-200 flex items-center justify-center font-sans">
      {/* Phone Frame Container */}
      <div className="w-full max-w-md h-[100dvh] sm:h-[90vh] sm:max-h-[900px] bg-slate-50 relative sm:rounded-[2.5rem] sm:border-[10px] sm:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Dynamic Island / Notch for Desktop aesthetics */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-slate-800 rounded-b-xl z-50 hidden sm:block pointer-events-none"></div>
        
        {/* Main App Content */}
        <div className="flex-grow h-full overflow-hidden relative">
          {getActiveView()}
        </div>

        {/* Install Prompt Overlay (Mobile Only) */}
        {showInstallPrompt && (
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur text-white p-4 rounded-2xl shadow-2xl z-50 animate-bounce">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-bold text-sm mb-1">安装 SlimChew App</p>
                <p className="text-xs text-slate-300">点击浏览器分享按钮 <Share className="inline w-3 h-3"/>，然后选择"添加到主屏幕" <span className="inline-block w-4 h-4 border border-slate-500 rounded text-[10px] text-center leading-3">+</span> 获得最佳全屏体验。</p>
              </div>
              <button onClick={() => setShowInstallPrompt(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;