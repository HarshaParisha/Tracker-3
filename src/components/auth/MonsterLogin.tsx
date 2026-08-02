import React, { useState, useEffect, useRef } from 'react';
import { authService } from '@/services/authService';
import { AlertCircle, Sparkles, Moon, Eye, EyeOff } from 'lucide-react';

interface MonsterLoginProps {
  onSuccess: () => void;
}

export const MonsterLogin: React.FC<MonsterLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [monsterState, setMonsterState] = useState<'idle' | 'typing' | 'success' | 'angry' | 'sleeping'>('idle');
  const [isCoveringEyes, setIsCoveringEyes] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const [remainingAttempts, setRemainingAttempts] = useState<number>(
    Math.max(0, 3 - authService.getFailedAttempts())
  );
  const [isLockedOut, setIsLockedOut] = useState(authService.isLockedOut());
  const [lockoutTimer, setLockoutTimer] = useState(authService.getLockoutRemainingSeconds());

  // Mouse Parallax Eye Tracking Listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 3;

      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);

      setMousePos({
        x: Math.max(-5, Math.min(5, deltaX * 5)),
        y: Math.max(-4, Math.min(4, deltaY * 4)),
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Lockout Timer Routine
  useEffect(() => {
    if (isLockedOut) {
      setMonsterState('sleeping');
      const interval = setInterval(() => {
        const remaining = authService.getLockoutRemainingSeconds();
        setLockoutTimer(remaining);
        if (remaining <= 0) {
          setIsLockedOut(false);
          setRemainingAttempts(3);
          setMonsterState('idle');
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLockedOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    const result = await authService.login(email, password);

    if (result.success) {
      setMonsterState('success');
      setErrorMsg('');
      setTimeout(() => {
        onSuccess();
      }, 900);
    } else {
      setRemainingAttempts(result.remainingAttempts);

      if (result.isLockedOut) {
        setIsLockedOut(true);
        setMonsterState('sleeping');
        setErrorMsg(result.message);
      } else {
        setMonsterState('angry');
        setErrorMsg(result.message);
        setTimeout(() => {
          setMonsterState('idle');
        }, 1800);
      }
    }
  };

  // Swappable CSS Color Variables for Monster Body
  const getMonsterColors = () => {
    switch (monsterState) {
      case 'success':
        return {
          body: '#2ec4b6', // Emerald Green
          dark: '#0f9f90',
          stroke: '#1b9aaa',
          button: '#1f8a70',
        };
      case 'angry':
        return {
          body: '#e63946', // Angry Red
          dark: '#b81d2a',
          stroke: '#8d0801',
          button: '#9d0208',
        };
      case 'sleeping':
        return {
          body: '#4a5568', // Dark Grey
          dark: '#2d3748',
          stroke: '#1a202c',
          button: '#2d3748',
        };
      default:
        return {
          body: '#ff9800', // Saturated Clay Orange
          dark: '#f57c00',
          stroke: '#e65100',
          button: '#e65100',
        };
    }
  };

  const colors = getMonsterColors();

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] p-4 select-none font-['Fredoka','Inter',sans-serif]">
      {/* Centered Sleek Dark Card Container (max-width ~500px) */}
      <div
        ref={containerRef}
        className="relative flex w-full max-w-[500px] flex-col items-center justify-between rounded-[28px] bg-[#14141e] p-6 sm:p-8 shadow-2xl overflow-hidden border border-[#272738] min-h-[580px]"
      >
        {/* Header Section */}
        <div className="pt-2 text-center z-10">
          <h1 className="text-5xl sm:text-6xl font-normal tracking-tight text-[#fffaf0] drop-shadow-sm font-['Fredoka']">
            Welcome,
          </h1>
          <p className="text-lg sm:text-xl font-normal tracking-wide text-gray-400 mt-1 font-['Fredoka']">
            let's get signed in!
          </p>
        </div>

        {/* Security Lockout / Error Alert Badge */}
        {isLockedOut ? (
          <div className="my-2 flex items-center gap-2 rounded-full bg-red-950/80 px-4 py-2 text-xs font-bold text-red-200 border border-red-500/40 backdrop-blur-md animate-pulse z-30">
            <Moon className="h-4 w-4 text-red-400" />
            <span>Lockout Active • Cooldown {Math.floor(lockoutTimer / 60)}m {lockoutTimer % 60}s</span>
          </div>
        ) : errorMsg ? (
          <div className="my-2 flex items-center gap-2 rounded-full bg-red-900/90 px-4 py-2 text-xs font-bold text-white border border-red-400 backdrop-blur-md animate-shake z-30 shadow-md">
            <AlertCircle className="h-4 w-4 text-yellow-300" />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        {/* Monster & Card Anatomy Container */}
        <div className="relative flex flex-col items-center w-full mt-4 z-10">
          {/* SVG Vector Monster Dome, Horns, Hair Tuft, and Eyes */}
          <div className="relative w-full h-[220px] -mb-16 z-10 transition-colors duration-300">
            <svg viewBox="0 0 300 200" className="w-full h-full drop-shadow-lg overflow-visible">
              {/* Thick Outward Curling Left Horn */}
              <path
                d="M 85 75 C 60 50, 30 40, 15 55 C 30 75, 65 85, 85 88 Z"
                fill={colors.body}
                stroke={colors.stroke}
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="transition-colors duration-300"
              />

              {/* Thick Outward Curling Right Horn */}
              <path
                d="M 215 75 C 240 50, 270 40, 285 55 C 270 75, 235 85, 215 88 Z"
                fill={colors.body}
                stroke={colors.stroke}
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="transition-colors duration-300"
              />

              {/* Scalloped 3-Bump Hair Tuft */}
              <path
                d="M 130 52 Q 140 40 150 52 Q 160 40 170 52 Z"
                fill={colors.body}
                stroke={colors.stroke}
                strokeWidth="2"
                className="transition-colors duration-300"
              />

              {/* Giant Rounded Body Dome Shape */}
              <path
                d="M 10 200 C 10 70, 290 70, 290 200 Z"
                fill={colors.body}
                stroke={colors.stroke}
                strokeWidth="3.5"
                className={`transition-colors duration-300 ${monsterState === 'angry' ? 'animate-bounce' : ''}`}
              />

              {/* Eyes Base (Positioned Close Together Near Top of Dome) */}
              {monsterState === 'sleeping' ? (
                /* Sleeping Eyes (-_-) */
                <g stroke="#1a202c" strokeWidth="4" strokeLinecap="round">
                  <line x1="125" y1="100" x2="142" y2="100" />
                  <line x1="158" y1="100" x2="175" y2="100" />
                </g>
              ) : monsterState === 'angry' ? (
                /* Angry Eyes (>_<) */
                <g stroke="#7f1d1d" strokeWidth="4" strokeLinecap="round">
                  <line x1="125" y1="92" x2="143" y2="104" />
                  <line x1="157" y1="104" x2="175" y2="92" />
                </g>
              ) : monsterState === 'success' ? (
                /* Sparkle Eyes */
                <g fill="#1a202c">
                  <circle cx="134" cy="98" r="12" fill="#ffffff" stroke="#1a202c" strokeWidth="2" />
                  <circle cx="166" cy="98" r="12" fill="#ffffff" stroke="#1a202c" strokeWidth="2" />
                  <circle cx="134" cy="98" r="6" fill={colors.dark} />
                  <circle cx="166" cy="98" r="6" fill={colors.dark} />
                  <circle cx="137" cy="95" r="2.5" fill="#ffffff" />
                  <circle cx="169" cy="95" r="2.5" fill="#ffffff" />
                </g>
              ) : (
                /* Round White Eyes with Mouse Parallax Pupil Tracking */
                <g stroke="#1a202c" strokeWidth="2">
                  <circle cx="134" cy="98" r="13" fill="#ffffff" />
                  <circle cx="166" cy="98" r="13" fill="#ffffff" />
                  {/* Pupils tracking mouse */}
                  <circle
                    cx={134 + (isCoveringEyes && !showPassword ? 0 : mousePos.x)}
                    cy={98 + (isCoveringEyes && !showPassword ? 0 : mousePos.y)}
                    r="5.5"
                    fill="#1a202c"
                  />
                  <circle
                    cx={166 + (isCoveringEyes && !showPassword ? 0 : mousePos.x)}
                    cy={98 + (isCoveringEyes && !showPassword ? 0 : mousePos.y)}
                    r="5.5"
                    fill="#1a202c"
                  />
                  {/* Eye Catchlight Reflection */}
                  <circle cx="132" cy="95" r="2" fill="#ffffff" />
                  <circle cx="164" cy="95" r="2" fill="#ffffff" />
                </g>
              )}

              {/* Floating Zzz for Sleeping Monster */}
              {monsterState === 'sleeping' && (
                <g fill="#ffffff" className="animate-pulse opacity-90 font-bold">
                  <text x="185" y="70" fontSize="18">Z</text>
                  <text x="200" y="55" fontSize="14">z</text>
                  <text x="210" y="42" fontSize="11">z</text>
                </g>
              )}

              {/* Paw Cover Eyes Animation (When Password Field Focused and not revealed) */}
              {isCoveringEyes && !showPassword && monsterState !== 'sleeping' && (
                <g className="transition-all duration-300 animate-view-fade">
                  {/* Left Paw Covering Left Eye */}
                  <path
                    d="M 100 130 C 100 85, 120 70, 142 85 C 130 110, 110 130, 100 130 Z"
                    fill={colors.body}
                    stroke={colors.stroke}
                    strokeWidth="3"
                  />
                  {/* Right Paw Covering Right Eye */}
                  <path
                    d="M 200 130 C 200 85, 180 70, 158 85 C 170 110, 190 130, 200 130 Z"
                    fill={colors.body}
                    stroke={colors.stroke}
                    strokeWidth="3"
                  />
                  {/* Paw Finger Bumps */}
                  <circle cx="135" cy="80" r="5" fill={colors.dark} />
                  <circle cx="143" cy="84" r="5" fill={colors.dark} />
                  <circle cx="165" cy="84" r="5" fill={colors.dark} />
                  <circle cx="173" cy="80" r="5" fill={colors.dark} />
                </g>
              )}
            </svg>
          </div>

          {/* Embedded Input Card */}
          <form
            onSubmit={handleSubmit}
            className={`w-full rounded-[24px] p-4 sm:p-5 shadow-2xl border-4 transition-all duration-300 relative z-20 ${
              monsterState === 'success'
                ? 'bg-[#0f9f90] border-[#a4d4c5]'
                : monsterState === 'angry'
                ? 'bg-[#b81d2a] border-[#fca5a5] animate-shake'
                : monsterState === 'sleeping'
                ? 'bg-[#2d3748] border-[#a0aec0]'
                : 'bg-[#ff9800] border-[#ffb74d]'
            }`}
          >
            {/* Sleek Dark Input Card Inner Container */}
            <div className="rounded-[18px] bg-[#1a1a24] p-3 sm:p-4 space-y-2.5 shadow-inner border border-[#2b2b3b]">
              {/* Email Input */}
              <div>
                <input
                  type="text"
                  required
                  disabled={isLockedOut}
                  placeholder="Email"
                  value={email}
                  onFocus={() => {
                    setMonsterState('typing');
                    setIsCoveringEyes(false);
                  }}
                  onBlur={() => setMonsterState('idle')}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#333347] bg-[#12121a] px-4 py-3 text-sm font-semibold text-white placeholder-gray-500 focus:border-[#ff9800] focus:outline-none disabled:bg-gray-800 transition font-['Inter']"
                />
              </div>

              {/* Password Input with Show/Hide Password Toggle Icon */}
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLockedOut}
                  placeholder="Password"
                  value={password}
                  onFocus={() => {
                    setMonsterState('typing');
                    setIsCoveringEyes(true);
                  }}
                  onBlur={() => {
                    setMonsterState('idle');
                    setIsCoveringEyes(false);
                  }}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#333347] bg-[#12121a] pl-4 pr-11 py-3 text-sm font-semibold text-white placeholder-gray-500 focus:border-[#ff9800] focus:outline-none disabled:bg-gray-800 transition font-['Inter']"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                  className="absolute right-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Bottom Section: Paws Gripping Bottom Corners + Centered Go Button */}
            <div className="mt-3.5 flex items-center justify-between relative px-2">
              {/* Left Paw / Hand */}
              <div className="flex items-center -space-x-1.5 z-30">
                <div className="h-6 w-6 rounded-full bg-[#f57c00] border-2 border-[#e65100] shadow-sm" />
                <div className="h-7 w-7 rounded-full bg-[#ff9800] border-2 border-[#e65100] shadow-sm" />
                <div className="h-6 w-6 rounded-full bg-[#f57c00] border-2 border-[#e65100] shadow-sm" />
              </div>

              {/* Centered Pill-Shaped Go Button */}
              <button
                type="submit"
                disabled={isLockedOut}
                className="w-full max-w-[130px] rounded-full py-2.5 font-['Fredoka'] text-xl font-bold tracking-wider lowercase text-white shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed z-20 hover:brightness-110 border border-white/20"
                style={{ backgroundColor: colors.button }}
              >
                {monsterState === 'success' ? (
                  <span className="flex items-center justify-center gap-1 text-base capitalize">
                    <Sparkles className="h-4 w-4" /> Open
                  </span>
                ) : (
                  'go'
                )}
              </button>

              {/* Right Paw / Hand */}
              <div className="flex items-center -space-x-1.5 z-30">
                <div className="h-6 w-6 rounded-full bg-[#f57c00] border-2 border-[#e65100] shadow-sm" />
                <div className="h-7 w-7 rounded-full bg-[#ff9800] border-2 border-[#e65100] shadow-sm" />
                <div className="h-6 w-6 rounded-full bg-[#f57c00] border-2 border-[#e65100] shadow-sm" />
              </div>
            </div>
          </form>

          {/* Remaining Attempts Warning */}
          {!isLockedOut && remainingAttempts < 3 && (
            <p className="mt-2 text-xs font-bold text-yellow-300 animate-pulse text-center">
              ⚠️ Warning: {remainingAttempts} attempt{remainingAttempts === 1 ? '' : 's'} remaining before 15-min lockout!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
