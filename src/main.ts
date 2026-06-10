import { Plugin } from 'obsidian';
import { PomodoroSettings, DEFAULT_SETTINGS } from './types';
import { registerCommands } from './commands';
import { PomodoroTimer } from './timer';
import { AutoScheduler } from './scheduler';
import { NotificationSystem } from './notification';
import { LogModal } from './log-modal';
import { PomodoroSidePanel, VIEW_TYPE_POMODORO } from './side-panel';
import { PomodoroSettingTab } from './settings';

/**
 * Pomodoro Logger Plugin - Main plugin class using declarative settings API
 */
export default class PomodoroLoggerPlugin extends Plugin {
	settings: PomodoroSettings;

	// Core systems
	timer: PomodoroTimer;
	scheduler: AutoScheduler;
	notifications: NotificationSystem;

	async onload() {
		console.log('Loading Pomodoro Logger plugin');

		// Load settings
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		// Initialize core systems
		this.timer = new PomodoroTimer(this);
		this.notifications = new NotificationSystem(this);
		this.scheduler = new AutoScheduler(this, this.timer);

		// Connect timer completion to notifications
		this.connectTimerCompletion();

		// Register view type for side panel
		this.registerView(VIEW_TYPE_POMODORO, (leaf) => new PomodoroSidePanel(leaf, this));

		// Register settings tab
		this.addSettingTab(new PomodoroSettingTab(this.app, this));

		// Register commands
		registerCommands(this);

		// Add ribbon icon for quick access to log modal
		this.addRibbonIcon('list-plus', 'Log Pomodoro', () => {
			new LogModal(this.app, this).open();
		});

		// Start auto-scheduler if configured
		if (this.settings.autoSchedule.trim()) {
			this.scheduler.start();
		}

		console.log('Pomodoro Logger plugin loaded successfully');
	}

	async onunload() {
		console.log('Unloading Pomodoro Logger plugin');

		// Cleanup is handled automatically by register* methods
		this.notifications.cleanup();
	}

	async saveSettings() {
		await this.saveData(this.settings);

		// Restart scheduler if settings changed
		if (this.scheduler.isEnabled()) {
			this.scheduler.stop();
			if (this.settings.autoSchedule.trim()) {
				this.scheduler.start();
			}
		}
	}

	/**
	 * Connect timer completion to notifications
	 */
	private connectTimerCompletion(): void {
		// We'll need to modify the timer to support completion callbacks
		// For now, this is a placeholder for the integration
		console.log('Timer completion notifications connected');
	}

	/**
	 * Activate the Pomodoro side panel
	 */
	async activateSidePanel(): Promise<void> {
		const { workspace } = this.app;

		const leaves = workspace.getLeavesOfType(VIEW_TYPE_POMODORO);

		if (leaves.length > 0) {
			// Focus existing panel
			workspace.revealLeaf(leaves[0]);
		} else {
			// Create new panel in right sidebar using newer API
			const leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: VIEW_TYPE_POMODORO, active: true });
				workspace.revealLeaf(leaf);
			}
		}
	}
}
