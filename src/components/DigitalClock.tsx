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
    <div className="flex items-center justify-center gap-4 p-4">
      <div className="p-3 rounded-lg bg-primary/10">
        <Clock className="h-8 w-8 text-primary" />
      </div>
      <div>
        <div className="text-4xl font-bold font-mono tracking-wider text-foreground">
          {timeString}
        </div>
        <div className="text-sm text-muted-foreground mt-1 capitalize">
          {dateString}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Horário de Brasília
        </div>
      </div>
    </div>
  );
};
