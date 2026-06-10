import { moment } from 'obsidian';

/**
 * Table column configuration
 */
export interface TableColumn {
	name: string;        // Column name (e.g., "Start Time", "Topic")
	purpose: string;      // Column purpose (e.g., "starttime", "productivity", "notes")
}

/**
 * Plugin settings interface using Obsidian's declarative settings API
 */
export interface PomodoroSettings {
	dailyNotePath: string;           // Moment.js syntax (e.g., "[Journal]/YYYY/[YYYY]-[MM]/YYYY-MM-DD dd")
	dailyNotesCommand: string;       // Command for creating daily notes (format: "plugin-id:command")
	pomodoroDuration: number;        // Minutes (default: 25)
	autoSchedule: string;            // CSV minutes (e.g., "0,30")
	soundEnabled: boolean;
	soundVolume: number;             // 0-100
	tableColumns: TableColumn[];      // Table column configuration
	sectionTitle: string;            // Title for Pomodoro sessions section
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: PomodoroSettings = {
	dailyNotePath: 'YYYY-MM-DD',
	dailyNotesCommand: '',           // Empty = only work with existing files
	pomodoroDuration: 25,
	autoSchedule: '',
	soundEnabled: true,
	soundVolume: 50,
	tableColumns: [
		{ name: 'Uhrzeit', purpose: 'starttime' },
		{ name: 'Topic', purpose: 'topic' },
		{ name: '+/-', purpose: 'productivity' },
		{ name: 'Notizen', purpose: 'notes' }
	],
	sectionTitle: '## Pomodoro Sessions'
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
