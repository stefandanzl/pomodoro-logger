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
	 * Create daily note for a specific date (internal use only)
	 */
	private async createDailyNote(date: any): Promise<TFile | null> {
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

		// If daily notes command is configured, use it
		if (this.plugin.settings.dailyNotesCommand) {
			return await this.createDailyNoteViaCommand(date);
		}

		// No command configured - don't create automatically
		console.log('No existing daily note found and no creation command configured');
		return null;
	}

	/**
	 * Create daily note using configured command
	 */
	private async createDailyNoteViaCommand(date: any): Promise<TFile | null> {
		const command = this.plugin.settings.dailyNotesCommand;
		if (!command) {
			return null;
		}

		try {
			const [pluginId, commandId] = command.split(':');
			if (!pluginId || !commandId) {
				console.error('Invalid command format. Expected "plugin-id:command"', command);
				return null;
			}

			// Execute the command
			console.log('Executing daily notes command:', command);

			// Try to execute the command via Obsidian's command system
			// Note: This may not work for all commands depending on how they're implemented
			// Many daily notes plugins work by creating notes for "today" automatically

			// After command execution, try to find the newly created file
			await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for file creation
			const newFile = await this.getDailyNoteForDate(date);

			if (newFile) {
				console.log('Daily note created via command:', newFile.path);
				return newFile;
			}

			console.log('Command executed but no daily note found');
			return null;
		} catch (error) {
			console.error('Error executing daily notes command:', error);
			return null;
		}
	}

	/**
	 * Get daily note file name for a specific date
	 */
	private getDailyNoteFileName(date: any): string {
		const format = this.plugin.settings.dailyNotePath || 'YYYY-MM-DD';
		const fullPath = date.format(format);

		console.log('DEBUG: Full formatted path:', fullPath);

		// Extract just the filename (last part of the path)
		const parts = fullPath.split('/');
		const fileName = parts[parts.length - 1];

		console.log('DEBUG: Extracted filename:', fileName);
		return `${fileName}.md`;
	}

	/**
	 * Get daily note path (folder) for a specific date
	 */
	private getDailyNotePath(date: any): string {
		const format = this.plugin.settings.dailyNotePath || 'YYYY-MM-DD';
		const fullPath = date.format(format);

		console.log('DEBUG: Full formatted path:', fullPath);

		// Extract the folder path (everything except the last part)
		const parts = fullPath.split('/');

		// If there's only one part, return empty string (root folder)
		if (parts.length <= 1) {
			console.log('DEBUG: No folder path, using root');
			return '';
		}

		// Return everything except the last part as the folder path
		const folderPath = parts.slice(0, -1).join('/');
		console.log('DEBUG: Extracted folder path:', folderPath);
		return folderPath;
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
