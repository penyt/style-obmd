import { Plugin } from "obsidian";
import { registerCommands } from "./commands";
import {
	ColorKey,
	ColorPalette,
} from "./conversion/converter";
import { createLivePreviewExtension } from "./live-preview/decorations";
import { processReadingView } from "./reading-view/processor";
import {
	DEFAULT_SETTINGS,
	StyleColorSettingKey,
	StyleObmdSettings,
	StyleObmdSettingTab,
} from "./settings";

const HIGHLIGHT_DECORATION_CLASS = "style-obmd-highlight-decoration";

// color keys
const COLOR_KEYS: ColorKey[] = [
	"r",
	"o",
	"y",
	"g",
	"b",
	"p",
	"gray",
];

// corresponding css classes
const KEY_TO_CLASS: Record<ColorKey, string> = {
	r: "cmk-r",
	o: "cmk-o",
	y: "cmk-y",
	g: "cmk-g",
	b: "cmk-b",
	p: "cmk-p",
	gray: "cmk-gray",
};

// corresponding css variables
const COLOR_VARIABLES: Record<ColorKey, string> = {
	r: "--style-obmd-r",
	o: "--style-obmd-o",
	y: "--style-obmd-y",
	g: "--style-obmd-g",
	b: "--style-obmd-b",
	p: "--style-obmd-p",
	gray: "--style-obmd-gray",
};

function isColorKey(value: string): value is ColorKey {
	return COLOR_KEYS.includes(value as ColorKey);
}

function getColorClass(key: string): string {
	return KEY_TO_CLASS[key as ColorKey];
}

// define the plugin class
export default class StyleObmdPlugin extends Plugin {
	settings!: StyleObmdSettings;

	async onload() {
		await this.loadSettings();
		this.applyStyles();

		// Live Preview
		this.registerEditorExtension(
			// call createLivePreviewExtension() in live-preview/decorations.ts
			createLivePreviewExtension({
				isColorKey,
				getColorClass,
			}),
		);
		// Reading View
		this.registerMarkdownPostProcessor((element) =>
			// call processReadingView() in reading-view/processor.ts
			processReadingView(element, {
				isColorKey,
				getColorClass,
			}),
		);
		// commands
		registerCommands(this, { // call registerCommands() in commands/index.ts
			isHighlightDecorationEnabled: () =>
				this.settings.highlightDecoration,
			getColors: () => this.getColorPalette(),
		});
		// settings tab
		this.addSettingTab(new StyleObmdSettingTab(this.app, this));
	}

	// Clean up styles when the plugin is disabled
	onunload() {
		const body = this.app.workspace.containerEl.ownerDocument.body;
		body.classList.remove(HIGHLIGHT_DECORATION_CLASS);
		for (const key of COLOR_KEYS) {
			body.style.removeProperty(COLOR_VARIABLES[key]);
		}
	}

	// Settings: Highlight Decoration
	async setHighlightDecoration(enabled: boolean): Promise<void> {
		this.settings.highlightDecoration = enabled;
		await this.saveSettings();
	}

	// Settings: Color
	async setColor(
		key: StyleColorSettingKey,
		value: string,
	): Promise<void> {
		this.settings[key] = value;
		await this.saveSettings();
	}

	// Settings: Reset Colors
	async resetColors(): Promise<void> {
		this.settings.redColor = DEFAULT_SETTINGS.redColor;
		this.settings.orangeColor = DEFAULT_SETTINGS.orangeColor;
		this.settings.yellowColor = DEFAULT_SETTINGS.yellowColor;
		this.settings.greenColor = DEFAULT_SETTINGS.greenColor;
		this.settings.blueColor = DEFAULT_SETTINGS.blueColor;
		this.settings.purpleColor = DEFAULT_SETTINGS.purpleColor;
		this.settings.grayColor = DEFAULT_SETTINGS.grayColor;
		await this.saveSettings();
	}

	private async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<StyleObmdSettings>,
		);
	}

	private async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.applyStyles();
	}

	private applyStyles(): void {
		const body = this.app.workspace.containerEl.ownerDocument.body;
		body.classList.toggle(
			HIGHLIGHT_DECORATION_CLASS,
			this.settings.highlightDecoration,
		);
		const colors = this.getColorPalette();
		for (const key of COLOR_KEYS) {
			body.style.setProperty(COLOR_VARIABLES[key], colors[key]);
		}
	}

	private getColorPalette(): ColorPalette {
		return {
			r: this.settings.redColor,
			o: this.settings.orangeColor,
			y: this.settings.yellowColor,
			g: this.settings.greenColor,
			b: this.settings.blueColor,
			p: this.settings.purpleColor,
			gray: this.settings.grayColor,
		};
	}
}
