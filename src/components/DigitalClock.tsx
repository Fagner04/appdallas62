import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="hover-lift bg-gradient-primary">
      <CardContent className="pt-6">
        <div className="flex items-center justify-center gap-4">
          <div className="p-3 rounded-lg bg-white/20 backdrop-blur">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <div className="text-white">
            <div className="text-4xl font-bold font-mono tracking-wider">
              {timeString}
            </div>
            <div className="text-sm opacity-90 mt-1 capitalize">
              {dateString}
            </div>
            <div className="text-xs opacity-75 mt-1">
              Horário de Brasília
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
