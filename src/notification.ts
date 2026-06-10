import PomodoroLoggerPlugin from './main';

/**
 * Notification and sound system for timer completion
 */
export class NotificationSystem {
	private plugin: PomodoroLoggerPlugin;
	private audioContext: AudioContext | null = null;

	constructor(plugin: PomodoroLoggerPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Show system notification and play sound
	 */
	async notifyPomodoroComplete(): Promise<void> {
		await this.showSystemNotification();
		if (this.plugin.settings.soundEnabled) {
			await this.playNotificationSound();
		}
	}

	/**
	 * Show native system notification
	 */
	private async showSystemNotification(): Promise<void> {
		if (!('Notification' in window)) {
			console.log('System notifications not supported');
			return;
		}

		// Request permission if needed
		if (Notification.permission === 'default') {
			await Notification.requestPermission();
		}

		if (Notification.permission === 'granted') {
			const notification = new Notification('Pomodoro Complete!', {
				body: 'Time to take a break or log your session.',
				icon: '⏰',
				requireInteraction: false
			});

			// Auto-close after 5 seconds
			setTimeout(() => {
				notification.close();
			}, 5000);
		}
	}

	/**
	 * Play notification sound using Web Audio API
	 */
	private async playNotificationSound(): Promise<void> {
		try {
			// Create audio context if needed
			if (!this.audioContext) {
				this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			}

			// Resume audio context if suspended (required by some browsers)
			if (this.audioContext.state === 'suspended') {
				await this.audioContext.resume();
			}

			// Create oscillator for tone generation
			const oscillator = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();

			// Set up the sound wave
			oscillator.connect(gainNode);
			gainNode.connect(this.audioContext.destination);

			// Configure sound parameters
			oscillator.type = 'sine';
			oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime); // 800Hz tone

			// Set volume (0.0 to 1.0)
			const volume = this.plugin.settings.soundVolume / 100;
			gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

			// Play the sound
			const now = this.audioContext.currentTime;
			oscillator.start(now);
			oscillator.stop(now + 0.2); // 200ms duration

			// Fade out for smooth ending
			gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

		} catch (error) {
			console.error('Error playing notification sound:', error);
		}
	}

	/**
	 * Test the notification sound
	 */
	async testSound(): Promise<void> {
		await this.playNotificationSound();
	}

	/**
	 * Cleanup audio resources
	 */
	cleanup(): void {
		if (this.audioContext && this.audioContext.state !== 'closed') {
			this.audioContext.close();
			this.audioContext = null;
		}
	}
}
