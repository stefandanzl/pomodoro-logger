import { App, ItemView, WorkspaceLeaf, moment } from 'obsidian';
import PomodoroLoggerPlugin from './main';
import { DailyNotesIntegration } from './daily-notes';
import { TableManager } from './table-manager';
import { PomodoroEntry } from './types';

export const VIEW_TYPE_POMODORO = 'pomodoro-view';

/**
 * Side panel view for displaying Pomodoro contribution grid
 */
export class PomodoroSidePanel extends ItemView {
	plugin: PomodoroLoggerPlugin;
	private dailyNotes: DailyNotesIntegration;
	private tableManager: TableManager;

	constructor(leaf: WorkspaceLeaf, plugin: PomodoroLoggerPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.dailyNotes = new DailyNotesIntegration(plugin);
		this.tableManager = new TableManager(plugin);
	}

	getViewType() {
		return VIEW_TYPE_POMODORO;
	}

	getDisplayText() {
		return 'Pomodoro Panel';
	}

	getIcon() {
		return 'list-plus';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('pomodoro-side-panel');

		// Header
		container.createEl('h2', { text: 'Pomodoro Contribution Grid' });

		// Controls
		const controls = container.createEl('div', { cls: 'panel-controls' });

		const refreshBtn = controls.createEl('button', {
			text: 'Refresh'
		});
		refreshBtn.addEventListener('click', () => this.renderGrid());

		// Grid container
		const gridContainer = container.createEl('div', { cls: 'contribution-grid-container' });

		// Legend
		const legend = container.createEl('div', { cls: 'legend' });
		legend.createEl('span', { text: 'Legend: ' });
		legend.createEl('span', { cls: 'legend-item productive', text: '+ (Productive)' });
		legend.createEl('span', { cls: 'legend-item unproductive', text: '- (Unproductive)' });
		legend.createEl('span', { cls: 'legend-item empty', text: 'Empty' });

		// Initial render
		await this.renderGrid();
	}

	/**
	 * Render the contribution grid
	 */
	private async renderGrid(): Promise<void> {
		try {
			const gridContainer = this.containerEl.querySelector('.contribution-grid-container');
			if (!gridContainer) return;

			gridContainer.empty();

			// Get last 90 days of data
			const daysData = await this.loadDaysData(90);

			// Create horizontal grid (days as columns)
			const grid = gridContainer.createEl('div', { cls: 'contribution-grid' });

			// Render each day as a column
			daysData.forEach(dayData => {
				const dayColumn = this.createDayColumn(dayData);
				grid.appendChild(dayColumn);
			});

		} catch (error) {
			console.error('Error rendering contribution grid:', error);
		}
	}

	/**
	 * Load data for specified number of days
	 */
	private async loadDaysData(daysCount: number): Promise<Array<{ date: any; entries: PomodoroEntry[] }>> {
		const daysData: Array<{ date: any; entries: PomodoroEntry[] }> = [];

		for (let i = daysCount - 1; i >= 0; i--) {
			const date = (moment as any)().subtract(i, 'days');
			const dailyNote = await this.dailyNotes.getDailyNoteForDate(date);

			let entries: PomodoroEntry[] = [];
			if (dailyNote) {
				entries = await this.tableManager.parseEntries(dailyNote);
			}

			daysData.push({ date, entries });
		}

		return daysData;
	}

	/**
	 * Create a single day column with Pomodoro cells
	 */
	private createDayColumn(dayData: { date: any; entries: PomodoroEntry[] }): HTMLElement {
		const { date, entries } = dayData;

		const dayColumn = document.createElement('div');
		dayColumn.addClass('day-column');

		// Day label at the top
		const dayLabel = dayColumn.createEl('div', { cls: 'day-label' });
		dayLabel.textContent = date.format('MM-DD');
		dayLabel.title = date.format('YYYY-MM-DD dddd');

		// Pomodoro cells for this day
		const cellsContainer = dayColumn.createEl('div', { cls: 'pomodoro-cells' });

		if (entries.length === 0) {
			// Empty day - show one empty cell
			const emptyCell = cellsContainer.createEl('div', { cls: 'grid-cell empty-cell' });
			emptyCell.title = `${date.format('YYYY-MM-DD')}: No Pomodoros`;
			emptyCell.addEventListener('click', () => this.handleCellClick(date, null));
		} else {
			// Show one cell per Pomodoro
			entries.forEach((entry, index) => {
				const cell = this.createPomodoroCell(entry, date, index);
				cellsContainer.appendChild(cell);
			});
		}

		return dayColumn;
	}

	/**
	 * Create a single Pomodoro cell
	 */
	private createPomodoroCell(entry: PomodoroEntry, date: any, index: number): HTMLElement {
		const cell = document.createElement('div');
		cell.addClass('grid-cell');

		// Color based on sign
		if (entry.sign === '+') {
			cell.addClass('productive-cell');
		} else if (entry.sign === '-') {
			cell.addClass('unproductive-cell');
		} else {
			cell.addClass('empty-cell');
		}

		// Tooltip with details
		const timeRange = entry.timeRange || 'Unknown time';
		const topic = entry.topic || 'No topic';
		cell.title = `${date.format('YYYY-MM-DD')} - ${timeRange}\nTopic: ${topic}\nSign: ${entry.sign || 'empty'}`;

		// Click to edit
		cell.addEventListener('click', () => this.handleCellClick(date, entry));

		return cell;
	}

	/**
	 * Handle cell click
	 */
	private handleCellClick(date: any, entry: PomodoroEntry | null): void {
		if (entry) {
			console.log('Edit entry:', entry);
			// TODO: Open edit modal for existing entry
		} else {
			console.log('No entry for:', date.format('YYYY-MM-DD'));
			// TODO: Could prompt to create a Pomodoro for this day
		}
	}

	async onClose() {
		// Cleanup if needed
	}
}
