import { PluginSettingTab, App, Setting } from 'obsidian';
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
		new Setting(containerEl)
			.setName('Daily Note Path')
			.setDesc('Moment.js syntax for daily note paths (e.g., YYYY-MM-DD, YYYY/YYYY-MM/YYYY-MM-DD)')
			.addText((text) => {
				text
					.setPlaceholder('YYYY-MM-DD')
					.setValue(this.plugin.settings.dailyNotePath)
					.onChange(async (value) => {
						this.plugin.settings.dailyNotePath = value;
						await this.plugin.saveSettings();
					});
			});

		// Pomodoro Duration
		new Setting(containerEl)
			.setName('Pomodoro Duration')
			.setDesc('Duration of each Pomodoro session in minutes')
			.addText((text) => {
				text
					.setPlaceholder('25')
					.setValue(this.plugin.settings.pomodoroDuration.toString())
					.onChange(async (value) => {
						const numValue = parseInt(value);
						if (!isNaN(numValue) && numValue > 0) {
							this.plugin.settings.pomodoroDuration = numValue;
							await this.plugin.saveSettings();
						}
					});
			});

		// Auto Schedule
		new Setting(containerEl)
			.setName('Auto Schedule')
			.setDesc('Comma-separated list of minutes to auto-start timer (e.g., "0,30" for :00 and :30 every hour)')
			.addText((text) => {
				text
					.setPlaceholder('0,30')
					.setValue(this.plugin.settings.autoSchedule)
					.onChange(async (value) => {
						this.plugin.settings.autoSchedule = value;
						await this.plugin.saveSettings();
					});
			});

		containerEl.createEl('h3', { text: 'Table Format Settings' });
		containerEl.createEl('p', {
			text: 'Customize how Pomodoro tables appear in your daily notes.',
			cls: 'setting-item-description'
		});

		// Section Title
		new Setting(containerEl)
			.setName('Section Title')
			.setDesc('Markdown heading for the Pomodoro sessions section (e.g., "## Pomodoro Sessions")')
			.addText((text) => {
				text
					.setPlaceholder('## Pomodoro Sessions')
					.setValue(this.plugin.settings.sectionTitle)
					.onChange(async (value) => {
						this.plugin.settings.sectionTitle = value;
						await this.plugin.saveSettings();
					});
			});

		// Table Header
		new Setting(containerEl)
			.setName('Table Header')
			.setDesc('Custom table header format (must match column structure)')
			.addTextArea((text) => {
				text
					.setPlaceholder('| Uhrzeit | Topic | +/- | Notizen |')
					.setValue(this.plugin.settings.tableHeader)
					.onChange(async (value) => {
						this.plugin.settings.tableHeader = value;
						await this.plugin.saveSettings();
					});
			});

		containerEl.createEl('p', {
			text: 'Note: Markdown table separators are auto-generated based on your header formatting.',
			cls: 'setting-item-description'
		});

		containerEl.createEl('h3', { text: 'Sound Settings' });

		// Sound Enabled
		new Setting(containerEl)
			.setName('Enable Sound')
			.setDesc('Play notification sound when Pomodoro completes')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.soundEnabled)
					.onChange(async (value) => {
						this.plugin.settings.soundEnabled = value;
						await this.plugin.saveSettings();
					});
			});

		// Sound Volume
		new Setting(containerEl)
			.setName('Sound Volume')
			.setDesc('Volume of notification sound (0-100%)')
			.addSlider((slider) => {
				slider
					.setLimits(0, 100, 5)
					.setValue(this.plugin.settings.soundVolume)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.soundVolume = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
