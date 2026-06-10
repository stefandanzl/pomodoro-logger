import { App, Modal, Notice, moment } from 'obsidian';
import PomodoroLoggerPlugin from './main';
import { DailyNotesIntegration } from './daily-notes';
import { TableManager } from './table-manager';

/**
 * Modal for logging completed Pomodoro sessions
 */
export class LogModal extends Modal {
	plugin: PomodoroLoggerPlugin;
	private dailyNotes: DailyNotesIntegration;
	private tableManager: TableManager;

	// Form elements
	private dateInput: HTMLInputElement;
	private startTimeInput: HTMLInputElement;
	private endTimeInput: HTMLInputElement;
	private topicInput: HTMLInputElement;
	private signSelect: HTMLSelectElement;
	private notesTextarea: HTMLTextAreaElement;

	constructor(app: App, plugin: PomodoroLoggerPlugin) {
		super(app);
		this.plugin = plugin;
		this.dailyNotes = new DailyNotesIntegration(plugin);
		this.tableManager = new TableManager(plugin);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('pomodoro-log-modal');

		// Header
		contentEl.createEl('h2', { text: 'Log Pomodoro Session' });

		// Create form
		const form = contentEl.createEl('form', {}, (form) => {
			form.addEventListener('submit', (e) => {
				e.preventDefault();
				this.onSubmit();
			});
		});

		// Date selector
		form.createEl('label', { text: 'Date:' });
		this.dateInput = form.createEl('input', {
			type: 'date',
			attr: { required: '' }
		});

		// Time inputs container (flexbox for side-by-side)
		const timeContainer = form.createEl('div', { cls: 'time-inputs-container' });

		// Start Time
		const startTimeContainer = timeContainer.createEl('div', { cls: 'time-input-group' });
		startTimeContainer.createEl('label', { text: 'Start Time:' });
		this.startTimeInput = startTimeContainer.createEl('input', {
			type: 'time',
			attr: { required: '', step: '60' } // Step by minutes
		});

		// End Time
		const endTimeContainer = timeContainer.createEl('div', { cls: 'time-input-group' });
		endTimeContainer.createEl('label', { text: 'End Time:' });
		this.endTimeInput = endTimeContainer.createEl('input', {
			type: 'time',
			attr: { required: '', step: '60' } // Step by minutes
		});

		// Topic
		form.createEl('label', { text: 'Topic:' });
		this.topicInput = form.createEl('input', {
			type: 'text',
			attr: { placeholder: 'What did you work on?', required: '' }
		});

		// Sign (+/-)
		form.createEl('label', { text: 'Productivity (+/-):' });
		this.signSelect = form.createEl('select');
		this.signSelect.createEl('option', { value: '', text: 'Select...' });
		this.signSelect.createEl('option', { value: '+', text: '+ (Productive)' });
		this.signSelect.createEl('option', { value: '-', text: '- (Unproductive)' });

		// Notes
		form.createEl('label', { text: 'Notes:' });
		this.notesTextarea = form.createEl('textarea', {
			attr: { placeholder: 'Additional notes about this session...', rows: 3 }
		});

		// Buttons
		const buttonContainer = form.createEl('div', { cls: 'modal-button-container' });

		const submitBtn = buttonContainer.createEl('button', {
			type: 'submit',
			text: 'Log Pomodoro',
			cls: 'mod-cta'
		});

		const cancelBtn = buttonContainer.createEl('button', {
			type: 'button',
			text: 'Cancel'
		});
		cancelBtn.addEventListener('click', () => this.close());

		// Pre-fill with smart defaults
		this.prefillDefaultValues();
	}

	/**
	 * Pre-fill form with smart defaults
	 */
	private prefillDefaultValues(): void {
		const now = (moment as any)();
		const durationMinutes = this.plugin.settings.pomodoroDuration;

		// Set date to today
		this.dateInput.value = now.format('YYYY-MM-DD');

		// Auto-schedule smart time filling
		const autoScheduleMinutes = this.getAutoScheduleMinutes();
		const currentMinute = now.minutes();

		// Calculate the best START time based on scheduled start times
		let suggestedStartMoment = now.clone().second(0); // Round to current minute

		if (autoScheduleMinutes.length > 0) {
			const sortedSchedules = [...autoScheduleMinutes].sort((a, b) => a - b); // Sort ascending

			// Find the most recent scheduled minute (<= current minute) to use as start time reference
			let lastSchedulePoint = currentMinute;

			for (const min of sortedSchedules) {
				if (min <= currentMinute) {
					lastSchedulePoint = min;
				}
			}

			// If current minute is before the first scheduled point, use last point from previous hour
			if (lastSchedulePoint === currentMinute && currentMinute < sortedSchedules[0]) {
				lastSchedulePoint = sortedSchedules[sortedSchedules.length - 1];
				suggestedStartMoment = suggestedStartMoment.subtract(1, 'hour').minute(lastSchedulePoint);
			} else {
				suggestedStartMoment = suggestedStartMoment.minute(lastSchedulePoint);
			}

			// Check if we're past the duration and should move to next slot
			const timeSinceStart = currentMinute - lastSchedulePoint;
			if (timeSinceStart >= durationMinutes) {
				// Move to next scheduled slot
				const nextIdx = sortedSchedules.indexOf(lastSchedulePoint) + 1;
				if (nextIdx < sortedSchedules.length) {
					suggestedStartMoment = suggestedStartMoment.minute(sortedSchedules[nextIdx]);
				} else {
					// Wrap to next hour
					suggestedStartMoment = suggestedStartMoment.add(1, 'hour').minute(sortedSchedules[0]);
				}
			}
		}

		// Calculate end time based on duration
		const suggestedEndMoment = suggestedStartMoment.clone().add(durationMinutes, 'minutes');

		// Format times as HH:mm
		this.startTimeInput.value = suggestedStartMoment.format('HH:mm');
		this.endTimeInput.value = suggestedEndMoment.format('HH:mm');
	}

	/**
	 * Get auto-schedule minutes as numbers
	 */
	private getAutoScheduleMinutes(): number[] {
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
	 * Handle form submission
	 */
	private async onSubmit(): Promise<void> {
		try {
			// Get form values
			const dateStr = this.dateInput.value;
			const startTimeStr = this.startTimeInput.value;
			const endTimeStr = this.endTimeInput.value;
			const topic = this.topicInput.value.trim();
			const sign = this.signSelect.value as '+' | '-' | '';
			const notes = this.notesTextarea.value.trim();

			// Validate
			if (!dateStr || !startTimeStr || !endTimeStr) {
				new Notice('Please fill in all date and time fields');
				return;
			}

			if (!topic) {
				new Notice('Please enter a topic');
				return;
			}

			// Parse date and times
			const startTime = (moment as any)(`${dateStr} ${startTimeStr}`, 'YYYY-MM-DD HH:mm');
			const endTime = (moment as any)(`${dateStr} ${endTimeStr}`, 'YYYY-MM-DD HH:mm');

			if (!startTime.isValid() || !endTime.isValid()) {
				new Notice('Invalid date or time format');
				return;
			}

			if (endTime.isBefore(startTime)) {
				new Notice('End time must be after start time');
				return;
			}

			// Get or create daily note
			const dailyNote = await this.dailyNotes.getOrCreateDailyNote(endTime);
			if (!dailyNote) {
				new Notice('Daily note not found. Please create it first or configure a creation command in settings.');
				return;
			}

			// Insert row into table
			const success = await this.tableManager.insertTableRow(
				dailyNote,
				startTime,
				endTime,
				topic,
				sign,
				notes
			);

			if (success) {
				new Notice('Pomodoro logged successfully!');
				this.close();
			} else {
				new Notice('Failed to log Pomodoro');
			}
		} catch (error) {
			console.error('Error logging Pomodoro:', error);
			new Notice('Error logging Pomodoro');
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
