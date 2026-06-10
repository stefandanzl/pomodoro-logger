import { App, Modal } from 'obsidian';
import PomodoroLoggerPlugin from './main';

/**
 * Modal for displaying active Pomodoro timer
 */
export class TimerModal extends Modal {
	plugin: PomodoroLoggerPlugin;

	// UI elements
	private timeDisplay: HTMLElement;
	private progressCircle: HTMLElement;
	private startPauseBtn: HTMLElement;
	private stopBtn: HTMLElement;
	private updateInterval: number | null = null;

	constructor(app: App, plugin: PomodoroLoggerPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('pomodoro-timer-modal');

		// Header
		contentEl.createEl('h2', { text: 'Pomodoro Timer' });

		// Timer display container
		const timerContainer = contentEl.createEl('div', { cls: 'timer-container' });

		// Progress circle
		this.progressCircle = timerContainer.createEl('div', { cls: 'progress-circle' });
		this.progressCircle.innerHTML = `
			<svg viewBox="0 0 100 100" class="progress-svg">
				<circle cx="50" cy="50" r="45" class="progress-bg" />
				<circle cx="50" cy="50" r="45" class="progress-fill" />
			</svg>
			<div class="time-display-container">
				<div class="time-display">25:00</div>
				<div class="status-text">Ready</div>
			</div>
		`;

		this.timeDisplay = this.progressCircle.querySelector('.time-display')!;

		// Control buttons
		const buttonContainer = timerContainer.createEl('div', { cls: 'button-container' });

		this.startPauseBtn = buttonContainer.createEl('button', {
			cls: 'start-pause-btn',
			text: 'Start'
		});
		this.startPauseBtn.addEventListener('click', () => this.toggleStartPause());

		this.stopBtn = buttonContainer.createEl('button', {
			cls: 'stop-btn',
			text: 'Stop'
		});
		this.stopBtn.addEventListener('click', () => this.stopTimer());

		// Session info
		const sessionInfo = timerContainer.createEl('div', { cls: 'session-info' });
		sessionInfo.createEl('div', { text: `Duration: ${this.plugin.settings.pomodoroDuration} minutes` });

		// Start update loop
		this.startUpdateLoop();
	}

	/**
	 * Toggle start/pause
	 */
	private toggleStartPause(): void {
		if (this.plugin.timer.isRunning()) {
			this.plugin.timer.pause();
		} else {
			this.plugin.timer.start();
		}
		this.updateUI();
	}

	/**
	 * Stop timer
	 */
	private stopTimer(): void {
		this.plugin.timer.stop();
		this.updateUI();
	}

	/**
	 * Start the update loop
	 */
	private startUpdateLoop(): void {
		this.updateInterval = window.setInterval(() => {
			this.updateUI();
		}, 1000);
	}

	/**
	 * Update UI elements
	 */
	private updateUI(): void {
		if (!this.timeDisplay || !this.progressCircle) return;

		const timeDisplay = this.timeDisplay;
		const statusText = this.progressCircle.querySelector('.status-text') as HTMLElement;
		const progressFill = this.progressCircle.querySelector('.progress-fill') as HTMLElement;

		// Update time display
		timeDisplay.textContent = this.plugin.timer.getFormattedTime();

		// Update progress circle
		const progress = this.plugin.timer.getProgress();
		const circumference = 2 * Math.PI * 45;
		const offset = circumference - (progress / 100) * circumference;
		progressFill.style.strokeDashoffset = offset.toString();

		// Update buttons and status
		if (this.plugin.timer.isRunning()) {
			this.startPauseBtn.textContent = 'Pause';
			statusText.textContent = 'Focus time!';
		} else if (this.plugin.timer.isPaused()) {
			this.startPauseBtn.textContent = 'Resume';
			statusText.textContent = 'Paused';
		} else {
			this.startPauseBtn.textContent = 'Start';
			statusText.textContent = 'Ready';
		}
	}

	onClose() {
		// Clean up update interval
		if (this.updateInterval !== null) {
			window.clearInterval(this.updateInterval);
			this.updateInterval = null;
		}

		const { contentEl } = this;
		contentEl.empty();
	}
}
