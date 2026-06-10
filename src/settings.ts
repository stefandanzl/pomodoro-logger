import { PluginSettingTab, App, Setting } from 'obsidian';
import PomodoroLoggerPlugin from './main';
import { TableColumn } from './types';

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
			.setDesc('Moment.js syntax for daily notes. Use [brackets] to escape literal text. Examples: "YYYY-MM-DD" or "[Journal]/YYYY/[YYYY]-[MM]/YYYY-MM-DD dd"')
			.addTextArea((text) => {
				text
					.setPlaceholder('YYYY-MM-DD')
					.setValue(this.plugin.settings.dailyNotePath)
					.onChange(async (value) => {
						this.plugin.settings.dailyNotePath = value;
						await this.plugin.saveSettings();
					});
			});

		// Daily Notes Creation Command
		new Setting(containerEl)
			.setName('Daily Notes Creation Command')
			.setDesc('Plugin command to create daily notes (format: "plugin-id:command"). Leave empty to only work with existing notes. Example: "daily-notes:open-today-note"')
			.addText((text) => {
				text
					.setPlaceholder('plugin-id:command')
					.setValue(this.plugin.settings.dailyNotesCommand)
					.onChange(async (value) => {
						this.plugin.settings.dailyNotesCommand = value;
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

		// Table Columns
		new Setting(containerEl)
			.setName('Table Columns')
			.setDesc('Configure the columns in your Pomodoro table. Add, remove, and edit columns below.')
			.addButton((btn) => {
				btn.setButtonText('Add Column');
				btn.setTooltip('Add a new table column');
				btn.onClick(() => {
					const newColumn: TableColumn = { name: 'New Column', purpose: 'custom' };
					this.plugin.settings.tableColumns.push(newColumn);
					this.plugin.saveSettings();
					this.display(); // Refresh the settings UI
				});
			});

		// Display existing columns
		this.plugin.settings.tableColumns.forEach((column, index) => {
			new Setting(containerEl)
				.setName(`Column: ${column.name}`)
				.setDesc(`Purpose: ${column.purpose}`)
				.addText((text) => {
					text.setValue(column.name);
					text.setPlaceholder('Column Name');
					text.onChange(async (value) => {
						column.name = value;
						await this.plugin.saveSettings();
					});
				})
				.addDropdown((dropdown) => {
					dropdown.addOption('starttime', 'Start Time');
					dropdown.addOption('topic', 'Topic');
					dropdown.addOption('productivity', 'Productivity (+/-)');
					dropdown.addOption('notes', 'Notes');
					dropdown.addOption('custom', 'Custom');

					dropdown.setValue(column.purpose);
					dropdown.onChange(async (value) => {
						column.purpose = value;
						await this.plugin.saveSettings();
					});
				})
				.addButton((btn) => {
					btn.setButtonText('Remove');
					btn.setTooltip(`Remove column "${column.name}"`);
					btn.onClick(() => {
						this.plugin.settings.tableColumns.splice(index, 1);
						this.plugin.saveSettings();
						this.display(); // Refresh the settings UI
					});
				});
		});

		containerEl.createEl('p', {
			text: 'Standard column purposes: starttime (time range), topic, productivity (+/-), notes',
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
