import { TFile, moment } from 'obsidian';
import PomodoroLoggerPlugin from './main';
import { PomodoroEntry } from './types';

/**
 * Pomodoro table manager for handling table operations in daily notes
 */
export class TableManager {
	private plugin: PomodoroLoggerPlugin;

	constructor(plugin: PomodoroLoggerPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Get the configured table header dynamically from columns
	 */
	private get tableHeader(): string {
		const columns = this.plugin.settings.tableColumns || [];
		if (columns.length === 0) {
			// Fallback to default header
			return '| Uhrzeit | Topic | +/- | Notizen |';
		}
		const columnNames = columns.map(col => col.name).join(' | ');
		return `| ${columnNames} |`;
	}

	/**
	 * Get the configured section title
	 */
	private get sectionTitle(): string {
		return this.plugin.settings.sectionTitle || '## Pomodoro Sessions';
	}

	/**
	 * Generate table separator from header
	 */
	private generateTableSeparator(): string {
		const columns = this.plugin.settings.tableColumns || [];
		if (columns.length === 0) {
			return '|---|---|---|---|';
		}
		return '|' + columns.map(() => '---').join('|') + '|';
	}

	/**
	 * Map column purpose to data field
	 */
	private mapColumnToData(column: any, startTime: any, endTime: any, topic: string, sign: string, notes: string): string {
		switch (column.purpose.toLowerCase()) {
			case 'starttime':
				return startTime.format('HH:mm');
			case 'timerange':
				return `${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}`;
			case 'endtime':
				return endTime.format('HH:mm');
			case 'productivity':
				return sign;
			case 'topic':
				return topic;
			case 'notes':
				return notes;
			case 'custom':
			default:
				return ''; // Custom columns default to empty
		}
	}

	/**
	 * Find Pomodoro table in daily note content
	 */
	findTable(content: string): { startLine: number; endLine: number } | null {
		const lines = content.split('\n');
		let tableStartLine = -1;

		// Normalize the configured header for comparison
		const normalizedConfigHeader = this.normalizeTableHeader(this.tableHeader);

		// Find the table header using robust matching
		for (let i = 0; i < lines.length; i++) {
			const normalizedLine = this.normalizeTableHeader(lines[i]);
			if (normalizedLine === normalizedConfigHeader) {
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
	 * Normalize table header for robust comparison
	 * Handles different spacing patterns while preserving column structure
	 */
	private normalizeTableHeader(header: string): string {
		return header
			.trim()
			.replace(/\s*\|\s*/g, '|')  // Normalize spacing around pipes
			.replace(/\s+/g, ' ')         // Normalize multiple spaces to single space
			.toLowerCase();              // Case-insensitive comparison
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
			this.sectionTitle,
			'',
			this.tableHeader,
			this.generateTableSeparator()
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
			let content = await this.app.vault.read(file);
			let tableFound = this.findTable(content);

			// Create table if it doesn't exist
			if (!tableFound) {
				content = this.createTable(content);
				await this.app.vault.modify(file, content);
				tableFound = this.findTable(content);
			}

			if (!tableFound) {
				console.error('Failed to create or find Pomodoro table');
				return false;
			}

			// Create the new row dynamically based on configured columns
			const columns = this.plugin.settings.tableColumns || [];
			const cellValues = columns.map(col =>
				this.mapColumnToData(col, startTime, endTime, topic, sign, notes)
			);
			const row = `| ${cellValues.join(' | ')} |`;

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
