import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';
import type { UrgencyLevel } from '../types';

interface CountdownResult {
  timeLeft: string;
  urgency: UrgencyLevel;
  isOverdue: boolean;
  secondsLeft: number;
}

export function useCountdown(dueDate: Date | string): CountdownResult {
  const [result, setResult] = useState<CountdownResult>(() => compute(dueDate));

  useEffect(() => {
    const update = () => setResult(compute(dueDate));
    update();
    const interval = setInterval(update, 60_000); // update every minute
    return () => clearInterval(interval);
  }, [dueDate]);

  return result;
}

function compute(dueDate: Date | string): CountdownResult {
  const due = new Date(dueDate);
  const secondsLeft = differenceInSeconds(due, new Date());

  if (secondsLeft <= 0) {
    return { timeLeft: 'OVERDUE', urgency: 'critical', isOverdue: true, secondsLeft: 0 };
  }

  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);

  let timeLeft: string;
  let urgency: UrgencyLevel;

  if (days > 3) {
    urgency = 'low';
    timeLeft = `${days}d ${hours}h`;
  } else if (days >= 1) {
    urgency = 'medium';
    timeLeft = `${days}d ${hours}h ${minutes}m`;
  } else if (hours >= 6) {
    urgency = 'high';
    timeLeft = `${hours}h ${minutes}m`;
  } else {
    urgency = 'critical';
    timeLeft = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  return { timeLeft, urgency, isOverdue: false, secondsLeft };
}
