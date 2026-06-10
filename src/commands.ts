import PomodoroLoggerPlugin from './main';
import { LogModal } from './log-modal';
import { TimerModal } from './timer-modal';
import { Notice } from 'obsidian';

/**
 * Register all plugin commands
 */
export function registerCommands(plugin: PomodoroLoggerPlugin): void {
	// Timer commands
	plugin.addCommand({
		id: 'start-pomodoro-timer',
		name: 'Start Pomodoro Timer',
		checkCallback: (checking: boolean) => {
			if (checking) {
				return !plugin.timer.isRunning() && !plugin.timer.isPaused();
			}
			plugin.timer.start();
			new Notice('Pomodoro timer started!');
		}
	});

	plugin.addCommand({
		id: 'pause-resume-timer',
		name: 'Pause/Resume Timer',
		checkCallback: (checking: boolean) => {
			if (checking) {
				return plugin.timer.isRunning() || plugin.timer.isPaused();
			}
			if (plugin.timer.isRunning()) {
				plugin.timer.pause();
				new Notice('Timer paused');
			} else if (plugin.timer.isPaused()) {
				plugin.timer.start();
				new Notice('Timer resumed');
			}
		}
	});

	plugin.addCommand({
		id: 'stop-timer',
		name: 'Stop Timer',
		checkCallback: (checking: boolean) => {
			if (checking) {
				return plugin.timer.isRunning() || plugin.timer.isPaused();
			}
			plugin.timer.stop();
			new Notice('Timer stopped');
		}
	});

	// Logging commands
	plugin.addCommand({
		id: 'log-pomodoro',
		name: 'Log Pomodoro',
		callback: () => {
			new LogModal(plugin.app, plugin).open();
		}
	});

	// Display commands
	plugin.addCommand({
		id: 'open-timer-modal',
		name: 'Open Timer Display',
		callback: () => {
			new TimerModal(plugin.app, plugin).open();
		}
	});

	// Panel commands
	plugin.addCommand({
		id: 'open-pomodoro-panel',
		name: 'Open Pomodoro Panel',
		callback: () => {
			plugin.activateSidePanel();
		}
	});

	// Settings commands
	plugin.addCommand({
		id: 'test-sound',
		name: 'Test Notification Sound',
		callback: () => {
			plugin.notifications.testSound();
			new Notice('Testing notification sound...');
		}
	});

	// Auto-scheduler commands
	plugin.addCommand({
		id: 'start-auto-scheduler',
		name: 'Start Auto-Scheduler',
		checkCallback: (checking: boolean) => {
			if (checking) {
				return !plugin.scheduler.isEnabled() && plugin.settings.autoSchedule.trim() !== '';
			}
			plugin.scheduler.start();
			new Notice('Auto-scheduler started');
		}
	});

	plugin.addCommand({
		id: 'stop-auto-scheduler',
		name: 'Stop Auto-Scheduler',
		checkCallback: (checking: boolean) => {
			if (checking) {
				return plugin.scheduler.isEnabled();
			}
			plugin.scheduler.stop();
			new Notice('Auto-scheduler stopped');
		}
	});
}
