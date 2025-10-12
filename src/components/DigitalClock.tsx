import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatBrasiliaDate, getBrasiliaDate } from '@/lib/timezone';

export const DigitalClock = () => {
  const [currentTime, setCurrentTime] = useState(getBrasiliaDate());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getBrasiliaDate());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeString = formatBrasiliaDate(currentTime, 'HH:mm:ss');
  const dateString = formatBrasiliaDate(currentTime, "EEEE, dd 'de' MMMM 'de' yyyy");

  return (
    <div className="flex items-center justify-center gap-3 p-3">
      <div className="p-2 rounded-lg bg-primary/10">
        <Clock className="h-5 w-5 text-primary" />
      </div>
      <div>
        <div className="text-2xl font-bold font-mono tracking-wider text-foreground">
          {timeString}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 capitalize">
          {dateString}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          Horário de Brasília
        </div>
      </div>
    </div>
  );
};
