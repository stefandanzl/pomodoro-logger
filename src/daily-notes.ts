import { TFile, TFolder, moment } from 'obsidian';
import PomodoroLoggerPlugin from './main';

/**
 * Daily notes integration for finding and creating daily notes
 */
export class DailyNotesIntegration {
	private plugin: PomodoroLoggerPlugin;

	constructor(plugin: PomodoroLoggerPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Get daily note file for a specific date
	 */
	async getDailyNoteForDate(date: any): Promise<TFile | null> {
		const fileName = this.getDailyNoteFileName(date);
		const dailyNotePath = this.getDailyNotePath(date);

		// Try to find existing file
		const existingFile = this.app.vault.getAbstractFileByPath(
			`${dailyNotePath}/${fileName}`
		);

		if (existingFile instanceof TFile) {
			return existingFile;
		}

		// Try to find in root if not in subfolder
		const rootFile = this.app.vault.getAbstractFileByPath(fileName);
		if (rootFile instanceof TFile) {
			return rootFile;
		}

		return null;
	}

	/**
	 * Create daily note for a specific date
	 */
	async createDailyNote(date: any): Promise<TFile | null> {
		const fileName = this.getDailyNoteFileName(date);
		const dailyNotePath = this.getDailyNotePath(date);

		// Ensure folder exists
		if (dailyNotePath) {
			const folder = this.app.vault.getAbstractFileByPath(dailyNotePath);
			if (!folder) {
				try {
					await this.app.vault.createFolder(dailyNotePath);
				} catch (error) {
					console.error('Failed to create daily notes folder:', error);
					return null;
				}
			}
		}

		// Create the file
		const filePath = dailyNotePath ? `${dailyNotePath}/${fileName}` : fileName;
		const content = this.getDefaultDailyNoteContent(date);

		try {
			const newFile = await this.app.vault.create(filePath, content);
			console.log('Created daily note:', filePath);
			return newFile;
		} catch (error) {
			console.error('Failed to create daily note:', error);
			return null;
		}
	}

	/**
	 * Get or create daily note for a specific date
	 */
	async getOrCreateDailyNote(date: any): Promise<TFile | null> {
		const existingNote = await this.getDailyNoteForDate(date);
		if (existingNote) {
			return existingNote;
		}

		return await this.createDailyNote(date);
	}

	/**
	 * Get daily note file name for a specific date
	 */
	private getDailyNoteFileName(date: moment.Moment): string {
		const format = this.plugin.settings.dailyNotePath || 'YYYY-MM-DD';
		return `${date.format(format)}.md`;
	}

	/**
	 * Get daily note path (folder) for a specific date
	 */
	private getDailyNotePath(date: moment.Moment): string {
		const format = this.plugin.settings.dailyNotePath || 'YYYY-MM-DD';
		const path = date.format(format);

		// Extract folder path if the format contains directory separators
		const lastSlashIndex = path.lastIndexOf('/');
		if (lastSlashIndex > 0) {
			return path.substring(0, lastSlashIndex);
		}

		return ''; // Root folder
	}

	/**
	 * Get default content for a new daily note
	 */
	private getDefaultDailyNoteContent(date: moment.Moment): string {
		return `# ${date.format('YYYY-MM-DD')}\n\n`;
	}

	/**
	 * Helper to get app instance
	 */
	private get app() {
		return this.plugin.app;
	}
}
