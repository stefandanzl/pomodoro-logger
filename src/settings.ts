import { PluginSettingTab, App } from 'obsidian';
import PomodoroLoggerPlugin from './main';

/**
 * Settings tab for the Pomodoro Logger plugin
 */
export class PomodoroSettingTab extends PluginSettingTab {
	plugin: PomodoroLoggerPlugin;

	constructor(app: App, plugin: PomodoroLoggerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Pomodoro Logger Settings' });

		// Daily Note Path
		new containerEl.createEl('div').createEl('label', { text: 'Daily Note Path' });
		new containerEl.createEl('input', {
			type: 'text',
			value: this.plugin.settings.dailyNotePath,
			placeholder: 'YYYY-MM-DD'
		}).addEventListener('change', async (e) => {
			this.plugin.settings.dailyNotePath = (e.target as HTMLInputElement).value;
			await this.plugin.saveSettings();
		});

		containerEl.createEl('p', {
			text: 'Moment.js syntax for daily note paths (e.g., YYYY-MM-DD, YYYY/YYYY-MM/YYYY-MM-DD)',
			cls: 'setting-item-description'
		});

		// Pomodoro Duration
		new containerEl.createEl('div').createEl('label', { text: 'Pomodoro Duration (minutes)' });
		new containerEl.createEl('input', {
			type: 'number',
			value: this.plugin.settings.pomodoroDuration.toString(),
			min: '1',
			max: '120'
		}).addEventListener('change', async (e) => {
			this.plugin.settings.pomodoroDuration = parseInt((e.target as HTMLInputElement).value);
			await this.plugin.saveSettings();
		});

		// Auto Schedule
		new containerEl.createEl('div').createEl('label', { text: 'Auto Schedule (minutes per hour)' });
		new containerEl.createEl('input', {
			type: 'text',
			value: this.plugin.settings.autoSchedule,
			placeholder: '0,30'
		}).addEventListener('change', async (e) => {
			this.plugin.settings.autoSchedule = (e.target as HTMLInputElement).value;
			await this.plugin.saveSettings();
		});

		containerEl.createEl('p', {
			text: 'Comma-separated list of minutes to auto-start timer (e.g., "0,30" for :00 and :30 every hour)',
			cls: 'setting-item-description'
		});

		// Sound Settings
		new containerEl.createEl('div').createEl('label', { text: 'Enable Sound' });
		new containerEl.createEl('input', {
			type: 'checkbox',
			checked: this.plugin.settings.soundEnabled
		}).addEventListener('change', async (e) => {
			this.plugin.settings.soundEnabled = (e.target as HTMLInputElement).checked;
			await this.plugin.saveSettings();
		});

		// Sound Volume
		new containerEl.createEl('div').createEl('label', { text: 'Sound Volume (%)' });
		new containerEl.createEl('input', {
			type: 'range',
			min: '0',
			max: '100',
			value: this.plugin.settings.soundVolume.toString()
		}).addEventListener('input', async (e) => {
			this.plugin.settings.soundVolume = parseInt((e.target as HTMLInputElement).value);
			await this.plugin.saveSettings();
		});
	}
}
