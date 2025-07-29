import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { 
  calculateContestStatus, 
  getTimeRemaining, 
  getTimeUntilStart,
  formatTimeRemaining,
  Contest 
} from '../lib/contestUtils';

interface ContestCountdownProps {
  contest: Contest;
  className?: string;
  showIcon?: boolean;
}

export function ContestCountdown({ contest, className = '', showIcon = true }: ContestCountdownProps) {
  const [timeData, setTimeData] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [status, setStatus] = useState<'draft' | 'active' | 'ended' | 'archived'>('draft');

  useEffect(() => {
    const updateTime = () => {
      const currentStatus = calculateContestStatus(contest);
      setStatus(currentStatus);

      if (currentStatus === 'active') {
        setTimeData(getTimeRemaining(contest));
      } else if (currentStatus === 'draft') {
        setTimeData(getTimeUntilStart(contest));
      } else {
        setTimeData(null);
      }
    };

    // Update immediately
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [contest]);

  if (status === 'ended') {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        {showIcon && <Clock className="h-4 w-4" />}
        <span className="font-medium">Contest Ended</span>
      </div>
    );
  }

  if (status === 'archived') {
    return (
      <div className={`flex items-center gap-2 text-gray-600 ${className}`}>
        {showIcon && <Calendar className="h-4 w-4" />}
        <span className="font-medium">Archived</span>
      </div>
    );
  }

  if (!timeData) {
    return null;
  }

  const isActive = status === 'active';
  const { days, hours, minutes, seconds } = timeData;

  return (
    <div className={`flex items-center gap-2 ${isActive ? 'text-green-600' : 'text-blue-600'} ${className}`}>
      {showIcon && <Clock className="h-4 w-4" />}
      <div className="flex items-center gap-1">
        <span className="font-medium">
          {isActive ? 'Ends in:' : 'Starts in:'}
        </span>
        <div className="flex items-center gap-1 font-mono">
          {days > 0 && (
            <>
              <span className="bg-black/10 px-1.5 py-0.5 rounded text-sm">
                {days}d
              </span>
            </>
          )}
          {(days > 0 || hours > 0) && (
            <>
              <span className="bg-black/10 px-1.5 py-0.5 rounded text-sm">
                {hours}h
              </span>
            </>
          )}
          {(days > 0 || hours > 0 || minutes > 0) && (
            <>
              <span className="bg-black/10 px-1.5 py-0.5 rounded text-sm">
                {minutes}m
              </span>
            </>
          )}
          <span className="bg-black/10 px-1.5 py-0.5 rounded text-sm">
            {seconds}s
          </span>
        </div>
      </div>
    </div>
  );
}

// Compact version for small spaces
export function ContestCountdownCompact({ contest, className = '' }: { contest: Contest; className?: string }) {
  const [timeString, setTimeString] = useState<string>('');
  const [status, setStatus] = useState<'draft' | 'active' | 'ended' | 'archived'>('draft');

  useEffect(() => {
    const updateTime = () => {
      const currentStatus = calculateContestStatus(contest);
      setStatus(currentStatus);

      if (currentStatus === 'active') {
        const time = getTimeRemaining(contest);
        setTimeString(time ? formatTimeRemaining(time) + ' left' : 'Ended');
      } else if (currentStatus === 'draft') {
        const time = getTimeUntilStart(contest);
        setTimeString(time ? formatTimeRemaining(time) + ' until start' : 'Starting');
      } else if (currentStatus === 'ended') {
        setTimeString('Ended');
      } else {
        setTimeString('Archived');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [contest]);

  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'ended': return 'text-red-600';
      case 'draft': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`flex items-center gap-1 ${getStatusColor()} ${className}`}>
      <Clock className="h-3 w-3" />
      <span className="text-xs font-medium">{timeString}</span>
    </div>
  );
}