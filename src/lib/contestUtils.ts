/**
 * Contest utility functions for status calculation and time management
 */

export type ContestStatus = 'draft' | 'active' | 'ended' | 'archived';

export interface Contest {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Calculate the actual contest status based on current time vs start/end dates
 * This overrides the database status for real-time accuracy
 */
export function calculateContestStatus(contest: Contest): ContestStatus {
  const now = new Date();
  const startDate = new Date(contest.start_date);
  const endDate = new Date(contest.end_date);

  // If stored as draft or archived, respect that
  if (contest.status === 'draft' || contest.status === 'archived') {
    return contest.status as ContestStatus;
  }

  // Calculate based on current time
  if (now < startDate) {
    return 'draft'; // Not started yet
  } else if (now >= startDate && now <= endDate) {
    return 'active'; // Currently running
  } else {
    return 'ended'; // Past end date
  }
}

/**
 * Get a human-readable status label
 */
export function getStatusLabel(status: ContestStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'active':
      return 'Active';
    case 'ended':
      return 'Ended';
    case 'archived':
      return 'Archived';
    default:
      return 'Unknown';
  }
}

/**
 * Get status color for UI components
 */
export function getStatusColor(status: ContestStatus): string {
  switch (status) {
    case 'draft':
      return 'text-gray-600 bg-gray-100';
    case 'active':
      return 'text-green-700 bg-green-100';
    case 'ended':
      return 'text-red-700 bg-red-100';
    case 'archived':
      return 'text-purple-700 bg-purple-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Check if a contest is currently active (running)
 */
export function isContestActive(contest: Contest): boolean {
  return calculateContestStatus(contest) === 'active';
}

/**
 * Check if a contest has ended
 */
export function isContestEnded(contest: Contest): boolean {
  return calculateContestStatus(contest) === 'ended';
}

/**
 * Get time remaining until contest ends (for active contests)
 * Returns null if contest is not active
 */
export function getTimeRemaining(contest: Contest): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} | null {
  const status = calculateContestStatus(contest);
  if (status !== 'active') {
    return null;
  }

  const now = new Date();
  const endDate = new Date(contest.end_date);
  const diffMs = endDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

/**
 * Get time until contest starts (for draft contests)
 * Returns null if contest has already started
 */
export function getTimeUntilStart(contest: Contest): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} | null {
  const now = new Date();
  const startDate = new Date(contest.start_date);
  
  if (now >= startDate) {
    return null;
  }

  const diffMs = startDate.getTime() - now.getTime();

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

/**
 * Format time remaining/until as a human-readable string
 */
export function formatTimeRemaining(time: { days: number; hours: number; minutes: number; seconds: number } | null): string {
  if (!time) {
    return '';
  }

  const { days, hours, minutes, seconds } = time;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Check if contest dates are valid
 */
export function validateContestDates(startDate: string, endDate: string): {
  isValid: boolean;
  error?: string;
} {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  if (start >= end) {
    return { isValid: false, error: 'End date must be after start date' };
  }

  if (end <= now) {
    return { isValid: false, error: 'End date must be in the future' };
  }

  return { isValid: true };
}