import PomodoroLoggerPlugin from './main';
import { TimerState } from './types';

/**
 * Core Timer class for managing Pomodoro sessions
 */
export class PomodoroTimer {
	private plugin: PomodoroLoggerPlugin;
	private state: TimerState = TimerState.Idle;
	private totalDuration: number = 25 * 60 * 1000; // 25 minutes in milliseconds
	private remainingTime: number = this.totalDuration;
	private startTime: number = 0;
	private elapsedTime: number = 0;
	private intervalId: number | null = null;

	constructor(plugin: PomodoroLoggerPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Start the timer
	 */
	async start(): Promise<void> {
		if (this.state === TimerState.Running) {
			return; // Already running
		}

		if (this.state === TimerState.Paused) {
			// Resume from pause
			this.startTime = Date.now() - this.elapsedTime;
		} else {
			// Fresh start
			this.totalDuration = this.plugin.settings.pomodoroDuration * 60 * 1000;
			this.remainingTime = this.totalDuration;
			this.startTime = Date.now();
			this.elapsedTime = 0;
		}

		this.state = TimerState.Running;
		this.startTimerInterval();
		console.log('Timer started');
	}

	/**
	 * Pause the timer
	 */
	pause(): void {
		if (this.state !== TimerState.Running) {
			return;
		}

		this.state = TimerState.Paused;
		this.elapsedTime = Date.now() - this.startTime;
		this.stopTimerInterval();
		console.log('Timer paused');
	}

	/**
	 * Stop the timer completely
	 */
	stop(): void {
		this.state = TimerState.Idle;
		this.remainingTime = this.totalDuration;
		this.elapsedTime = 0;
		this.startTime = 0;
		this.stopTimerInterval();
		console.log('Timer stopped');
	}

	/**
	 * Reset the timer to initial state
	 */
	reset(): void {
		this.stop();
		console.log('Timer reset');
	}

	/**
	 * Get current timer state
	 */
	getState(): TimerState {
		return this.state;
	}

	/**
	 * Get remaining time in milliseconds
	 */
	getRemainingTime(): number {
		if (this.state === TimerState.Running) {
			const elapsed = Date.now() - this.startTime;
			return Math.max(0, this.totalDuration - elapsed);
		} else if (this.state === TimerState.Paused) {
			return this.remainingTime;
		}
		return this.totalDuration;
	}

	/**
	 * Get progress percentage (0-100)
	 */
	getProgress(): number {
		const remaining = this.getRemainingTime();
		return ((this.totalDuration - remaining) / this.totalDuration) * 100;
	}

	/**
	 * Get formatted time string (MM:SS)
	 */
	getFormattedTime(): string {
		const remaining = this.getRemainingTime();
		const minutes = Math.floor(remaining / 60000);
		const seconds = Math.floor((remaining % 60000) / 1000);
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	/**
	 * Check if timer is currently running
	 */
	isRunning(): boolean {
		return this.state === TimerState.Running;
	}

	/**
	 * Check if timer is paused
	 */
	isPaused(): boolean {
		return this.state === TimerState.Paused;
	}

	/**
	 * Start the timer interval using Obsidian's registerInterval
	 */
	private startTimerInterval(): void {
		// Update every second
		this.intervalId = window.setInterval(() => {
			this.updateTimer();
		}, 1000);

		// Register with Obsidian for automatic cleanup
		this.plugin.registerInterval(this.intervalId);
	}

	/**
	 * Stop the timer interval
	 */
	private stopTimerInterval(): void {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	/**
	 * Update timer state and check for completion
	 */
	private updateTimer(): void {
		const remaining = this.getRemainingTime();
		this.remainingTime = remaining;

		if (remaining <= 0) {
			this.onTimerComplete();
		}
	}

	/**
	 * Handle timer completion
	 */
	private async onTimerComplete(): Promise<void> {
		console.log('Timer completed!');
		this.state = TimerState.Completed;
		this.stopTimerInterval();

		// Import NotificationSystem here to avoid circular dependency
		const { NotificationSystem } = await import('./notification');
		const notificationSystem = new NotificationSystem(this.plugin);
		await notificationSystem.notifyPomodoroComplete();
	}
}
