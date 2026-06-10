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

		contentEl.createEl('h2', { text: 'Log Pomodoro Session' });

		// Create form
		const form = contentEl.createEl('form', {}, (form) => {
			form.addEventListener('submit', (e) => {
				e.preventDefault();
				this.onSubmit();
			});
		});

		// Start Time
		form.createEl('label', { text: 'Start Time:' });
		this.startTimeInput = form.createEl('input', {
			type: 'datetime-local',
			attr: { required: '' }
		});

		// End Time
		form.createEl('label', { text: 'End Time:' });
		this.endTimeInput = form.createEl('input', {
			type: 'datetime-local',
			attr: { required: '' }
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
		this.signSelect.createEl('option', { value: '+', text: '+' });
		this.signSelect.createEl('option', { value: '-', text: '-' });

		// Notes
		form.createEl('label', { text: 'Notes:' });
		this.notesTextarea = form.createEl('textarea', {
			attr: { placeholder: 'Additional notes about this session...', rows: 3 }
		});

		// Buttons
		const buttonContainer = form.createEl('div', { cls: 'modal-button-container' });

		const submitBtn = buttonContainer.createEl('button', {
			type: 'submit',
			text: 'Log Pomodoro'
		});

		const cancelBtn = buttonContainer.createEl('button', {
			type: 'button',
			text: 'Cancel'
		});
		cancelBtn.addEventListener('click', () => this.close());

		// Pre-fill with default values
		this.prefillDefaultValues();
	}

	/**
	 * Pre-fill form with default values
	 */
	private prefillDefaultValues(): void {
		const now = (moment as any)();
		const durationMinutes = this.plugin.settings.pomodoroDuration;
		const startTime = now.clone().subtract(durationMinutes, 'minutes');

		// Format for datetime-local input (YYYY-MM-DDTHH:mm)
		this.startTimeInput.value = startTime.format('YYYY-MM-DDTHH:mm');
		this.endTimeInput.value = now.format('YYYY-MM-DDTHH:mm');
	}

	/**
	 * Handle form submission
	 */
	private async onSubmit(): Promise<void> {
		try {
			// Get form values
			const startTime = (moment as any)(this.startTimeInput.value, 'YYYY-MM-DDTHH:mm');
			const endTime = (moment as any)(this.endTimeInput.value, 'YYYY-MM-DDTHH:mm');
			const topic = this.topicInput.value.trim();
			const sign = this.signSelect.value as '+' | '-' | '';
			const notes = this.notesTextarea.value.trim();

			// Validate
			if (!startTime.isValid() || !endTime.isValid()) {
				new Notice('Invalid time format');
				return;
			}

			if (!topic) {
				new Notice('Please enter a topic');
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
