"use client";

interface CalorieProgressProps {
  current: number;
  goal: number;
  burned: number;
}

export default function CalorieProgress({ current, goal, burned }: CalorieProgressProps) {
  const net = current - burned;
  const percentage = Math.min((current / goal) * 100, 100);
  const isOver = current > goal;
  const remaining = Math.max(goal - current, 0);

  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="glass-card p-6">
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <defs>
              <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={isOver ? "#EF4444" : "#3B82F6"} />
                <stop offset="100%" stopColor={isOver ? "#DC2626" : "#8B5CF6"} />
              </linearGradient>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
            <circle
              cx={size / 2} cy={size / 2} r={radius} fill="none"
              stroke="url(#calorieGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-light">{current}</span>
            <span className="text-xs text-[#666]">/ {goal} kcal</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-5 w-full text-center">
          <div>
            <p className="text-lg font-bold">{current}</p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider">Assunte</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[#F59E0B]">{burned}</p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider">Bruciate</p>
          </div>
          <div>
            <p className={`text-lg font-bold ${isOver ? "text-[#EF4444]" : "text-[#22C55E]"}`}>
              {isOver ? `+${current - goal}` : remaining}
            </p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider">
              {isOver ? "Eccesso" : "Rimaste"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
