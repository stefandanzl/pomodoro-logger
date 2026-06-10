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
		legend.createEl('span', { cls: 'legend-item productive', text: '+' });
		legend.createEl('span', { cls: 'legend-item unproductive', text: '-' });
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

			// Create grid
			const grid = gridContainer.createEl('div', { cls: 'contribution-grid' });

			// Group by week for better layout
			const weeks = this.groupByWeek(daysData);

			// Render each week
			weeks.forEach(week => {
				const weekColumn = grid.createEl('div', { cls: 'week-column' });

				// Day labels (Mon, Wed, Fri)
				this.createDayLabels(weekColumn);

				// Render each day in the week
				week.forEach(dayData => {
					const cell = this.createGridCell(dayData);
					weekColumn.appendChild(cell);
				});
			});

		} catch (error) {
			console.error('Error rendering contribution grid:', error);
		}
	}

	/**
	 * Load data for specified number of days
	 */
	private async loadDaysData(daysCount: number): Promise<Array<{ date: any; entries: PomodoroEntry[] }>> {
		const daysData: Array<{ date: moment.Moment; entries: PomodoroEntry[] }> = [];

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
	 * Group days by week for grid layout
	 */
	private groupByWeek(daysData: Array<{ date: any; entries: PomodoroEntry[] }>): Array<Array<{ date: any; entries: PomodoroEntry[] }>> {
		const weeks: Array<Array<{ date: moment.Moment; entries: PomodoroEntry[] }>> = [];
		let currentWeek: Array<{ date: moment.Moment; entries: PomodoroEntry[] }> = [];

		daysData.forEach(dayData => {
			const dayOfWeek = dayData.date.day();

			// Start new week on Sunday (day 0)
			if (dayOfWeek === 0 && currentWeek.length > 0) {
				weeks.push(currentWeek);
				currentWeek = [];
			}

			currentWeek.push(dayData);
		});

		// Add the last week
		if (currentWeek.length > 0) {
			weeks.push(currentWeek);
		}

		return weeks;
	}

	/**
	 * Create day labels for a week column
	 */
	private createDayLabels(container: HTMLElement): void {
		const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const labelDays = [0, 2, 4, 6]; // Show Sun, Tue, Thu, Sat labels

		labelDays.forEach(dayIndex => {
			if (dayIndex < days.length) {
				const label = container.createEl('div', {
					cls: 'day-label',
					text: days[dayIndex]
				});
			}
		});
	}

	/**
	 * Create a single grid cell
	 */
	private createGridCell(dayData: { date: any; entries: PomodoroEntry[] }): HTMLElement {
		const cell = document.createElement('div');
		cell.addClass('grid-cell');

		const { date, entries } = dayData;

		// Determine cell color based on entries
		if (entries.length === 0) {
			cell.addClass('empty-cell');
		} else {
			const hasPositive = entries.some(e => e.sign === '+');
			const hasNegative = entries.some(e => e.sign === '-');

			if (hasPositive && !hasNegative) {
				cell.addClass('productive-cell');
			} else if (hasNegative && !hasPositive) {
				cell.addClass('unproductive-cell');
			} else {
				cell.addClass('mixed-cell');
			}
		}

		// Add tooltip with date and entry count
		cell.title = `${date.format('YYYY-MM-DD')}: ${entries.length} Pomodoro(s)`;

		// Make cell clickable to edit entries
		cell.addEventListener('click', () => {
			this.handleCellClick(date, entries);
		});

		return cell;
	}

	/**
	 * Handle cell click
	 */
	private handleCellClick(date: any, entries: PomodoroEntry[]): void {
		if (entries.length === 0) {
			console.log('No entries for', date.format('YYYY-MM-DD'));
			// Could open log modal pre-filled with this date
		} else {
			console.log('Entries for', date.format('YYYY-MM-DD'), ':', entries);
			// Could open edit modal for existing entries
		}
	}

	async onClose() {
		// Cleanup if needed
	}
}
