import PomodoroLoggerPlugin from './main';
import { PomodoroTimer } from './timer';

/**
 * Auto-scheduler for starting Pomodoros at configured times
 */
export class AutoScheduler {
	private plugin: PomodoroLoggerPlugin;
	private timer: PomodoroTimer;
	private intervalId: number | null = null;
	private enabled: boolean = false;

	constructor(plugin: PomodoroLoggerPlugin, timer: PomodoroTimer) {
		this.plugin = plugin;
		this.timer = timer;
	}

	/**
	 * Start the auto-scheduler
	 */
	start(): void {
		if (this.enabled) {
			return; // Already running
		}

		const schedule = this.parseSchedule();
		if (schedule.length === 0) {
			console.log('No auto-schedule configured');
			return;
		}

		this.enabled = true;
		this.startSchedulerInterval();
		console.log('Auto-scheduler started for minutes:', schedule);
	}

	/**
	 * Stop the auto-scheduler
	 */
	stop(): void {
		this.enabled = false;
		this.stopSchedulerInterval();
		console.log('Auto-scheduler stopped');
	}

	/**
	 * Check if scheduler is enabled
	 */
	isEnabled(): boolean {
		return this.enabled;
	}

	/**
	 * Parse the schedule string into array of minute values
	 */
	private parseSchedule(): number[] {
		const scheduleStr = this.plugin.settings.autoSchedule.trim();
		if (!scheduleStr) {
			return [];
		}

		return scheduleStr
			.split(',')
			.map((s: string) => parseInt(s.trim(), 10))
			.filter((n: number) => !isNaN(n) && n >= 0 && n < 60);
	}

	/**
	 * Start the scheduler interval
	 */
	private startSchedulerInterval(): void {
		// Check every minute if we should start a timer
		this.intervalId = window.setInterval(() => {
			this.checkAndStartTimer();
		}, 60000); // Check every 60 seconds

		// Register with Obsidian for automatic cleanup
		this.plugin.registerInterval(this.intervalId);
	}

	/**
	 * Stop the scheduler interval
	 */
	private stopSchedulerInterval(): void {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	/**
	 * Check if current minute matches schedule and start timer if appropriate
	 */
	private checkAndStartTimer(): void {
		if (!this.enabled) {
			return;
		}

		// Don't start if timer is already running
		if (this.timer.isRunning() || this.timer.isPaused()) {
			return;
		}

		const schedule = this.parseSchedule();
		const currentMinute = new Date().getMinutes();

		if (schedule.includes(currentMinute)) {
			console.log(`Auto-scheduler starting timer at :${currentMinute.toString().padStart(2, '0')}`);
			this.timer.start();
		}
	}
}
