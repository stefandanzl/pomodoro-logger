import { TFile, moment } from 'obsidian';
import PomodoroLoggerPlugin from './main';
import { PomodoroEntry } from './types';

/**
 * Pomodoro table manager for handling table operations in daily notes
 */
export class TableManager {
	private plugin: PomodoroLoggerPlugin;
	private readonly TABLE_HEADER = '| Uhrzeit | Topic | +/- | Notizen |';
	private readonly TABLE_SEPARATOR = '|---|---|---|---|';

	constructor(plugin: PomodoroLoggerPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Find Pomodoro table in daily note content
	 */
	findTable(content: string): { startLine: number; endLine: number } | null {
		const lines = content.split('\n');
		let tableStartLine = -1;

		// Find the table header
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].trim() === this.TABLE_HEADER) {
				tableStartLine = i;
				break;
			}
		}

		if (tableStartLine === -1) {
			return null; // Table not found
		}

		// Find the end of the table (next empty line or end of file)
		let tableEndLine = tableStartLine + 1;
		for (let i = tableStartLine + 1; i < lines.length; i++) {
			if (lines[i].trim() === '') {
				break;
			}
			tableEndLine = i;
		}

		return { startLine: tableStartLine, endLine: tableEndLine };
	}

	/**
	 * Create Pomodoro table in daily note
	 */
	createTable(content: string): string {
		const lines = content.split('\n');

		// Check if table already exists
		if (this.findTable(content)) {
			return content;
		}

		// Add table at the end of the file
		const tableLines = [
			'',
			'## Pomodoro Sessions',
			'',
			this.TABLE_HEADER,
			this.TABLE_SEPARATOR
		];

		return content + tableLines.join('\n');
	}

	/**
	 * Insert a new row into the Pomodoro table
	 */
	async insertTableRow(
		file: TFile,
		startTime: any,
		endTime: any,
		topic: string,
		sign: '+' | '-' | '',
		notes: string
	): Promise<boolean> {
		try {
			const content = await this.app.vault.read(file);
			let tableFound = this.findTable(content);

			// Create table if it doesn't exist
			if (!tableFound) {
				const updatedContent = this.createTable(content);
				await this.app.vault.modify(file, updatedContent);
				tableFound = this.findTable(updatedContent);
			}

			if (!tableFound) {
				console.error('Failed to create or find Pomodoro table');
				return false;
			}

			// Create the new row
			const timeRange = `${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}`;
			const row = `| ${timeRange} | ${topic} | ${sign} | ${notes} |`;

			// Insert the row after the table
			const lines = content.split('\n');
			const insertIndex = tableFound.endLine + 1;

			// Insert with proper spacing
			lines.splice(insertIndex, 0, row);

			// Write back to file
			const updatedContent = lines.join('\n');
			await this.app.vault.modify(file, updatedContent);

			console.log('Inserted Pomodoro row:', row);
			return true;
		} catch (error) {
			console.error('Error inserting table row:', error);
			return false;
		}
	}

	/**
	 * Parse Pomodoro entries from daily note
	 */
	async parseEntries(file: TFile): Promise<PomodoroEntry[]> {
		const entries: PomodoroEntry[] = [];

		try {
			const content = await this.app.vault.read(file);
			const tableFound = this.findTable(content);

			if (!tableFound) {
				return entries;
			}

			const lines = content.split('\n');
			const date = this.extractDateFromFileName(file.basename);

			// Parse table rows (skip header and separator)
			for (let i = tableFound.startLine + 2; i <= tableFound.endLine; i++) {
				const line = lines[i].trim();
				if (!line || !line.startsWith('|')) {
					continue;
				}

				const entry = this.parseTableRow(line, date);
				if (entry) {
					entries.push(entry);
				}
			}
		} catch (error) {
			console.error('Error parsing Pomodoro entries:', error);
		}

		return entries;
	}

	/**
	 * Parse a single table row
	 */
	private parseTableRow(line: string, date: moment.Moment): PomodoroEntry | null {
		// Remove leading/trailing | and split
		const parts = line.trim().split('|').filter(p => p !== '');

		if (parts.length < 4) {
			return null;
		}

		return {
			timeRange: parts[0].trim(),
			topic: parts[1].trim(),
			sign: (parts[2].trim() as '+' | '-' | '') || '',
			notes: parts[3].trim(),
			date: date
		};
	}

	/**
	 * Extract date from daily note filename
	 */
	private extractDateFromFileName(basename: string): any {
		// Try common date formats
		const formats = [
			'YYYY-MM-DD',
			'YYYY-MM-DD-dddd',
			'YYYYMMDD',
			'MM-DD-YYYY'
		];

		for (const format of formats) {
			try {
				const date = (moment as any)(basename, format);
				if (date.isValid()) {
					return date;
				}
			} catch {
				// Try next format
			}
		}

		// Fallback to current date
		return (moment as any)();
	}

	/**
	 * Helper to get app instance
	 */
	private get app() {
		return this.plugin.app;
	}
}
