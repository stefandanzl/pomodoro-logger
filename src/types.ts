import { moment } from 'obsidian';

/**
 * Plugin settings interface using Obsidian's declarative settings API
 */
export interface PomodoroSettings {
	dailyNotePath: string;        // Moment.js syntax (e.g., "YYYY-MM-DD")
	pomodoroDuration: number;     // Minutes (default: 25)
	autoSchedule: string;         // CSV minutes (e.g., "0,30")
	soundEnabled: boolean;
	soundVolume: number;          // 0-100
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: PomodoroSettings = {
	dailyNotePath: 'YYYY-MM-DD',
	pomodoroDuration: 25,
	autoSchedule: '',
	soundEnabled: true,
	soundVolume: 50
};

/**
 * Timer state enumeration
 */
export enum TimerState {
	Idle = 'idle',
	Running = 'running',
	Paused = 'paused',
	Completed = 'completed'
}

/**
 * Pomodoro session data structure
 */
export interface PomodoroSession {
	startTime: moment.Moment;
	endTime: moment.Moment;
	topic: string;
	sign: '+' | '-' | '';
	notes: string;
}

/**
 * Parsed Pomodoro entry from daily note table
 */
export interface PomodoroEntry {
	timeRange: string;
	topic: string;
	sign: '+' | '-' | '';
	notes: string;
	date: moment.Moment;
}

/**
 * Contribution grid cell data
 */
export interface ContributionCell {
	date: moment.Moment;
	entries: PomodoroEntry[];
	hasData: boolean;
}
