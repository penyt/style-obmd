import { App, PluginSettingTab, Setting } from "obsidian";
import type StyleObmdPlugin from "./main";

export interface StyleObmdSettings {
	highlightDecoration: boolean;
	redColor: string;
	orangeColor: string;
	yellowColor: string;
	greenColor: string;
	blueColor: string;
	purpleColor: string;
	grayColor: string;
}

export const DEFAULT_SETTINGS: StyleObmdSettings = {
	highlightDecoration: true,
	redColor: "#fb4646",
	orangeColor: "#e9783f",
	yellowColor: "#e0ac00",
	greenColor: "#44cf6e",
	blueColor: "#5389df",
	purpleColor: "#be75ff",
	grayColor: "#9e9e9e",
};

export type StyleColorSettingKey = Exclude<
	keyof StyleObmdSettings,
	"highlightDecoration"
>;

const COLOR_SETTINGS: Array<{
	key: StyleColorSettingKey;
	name: string;
	description: string;
}> = [
	{
		key: "redColor",
		name: "Red",
		description: "Color used by the {r} marker.",
	},
	{
		key: "orangeColor",
		name: "Orange",
		description: "Color used by the {o} marker.",
	},
	{
		key: "yellowColor",
		name: "Yellow",
		description: "Color used by the {y} marker.",
	},
	{
		key: "greenColor",
		name: "Green",
		description: "Color used by the {g} marker.",
	},
	{
		key: "blueColor",
		name: "Blue",
		description: "Color used by the {b} marker.",
	},
	{
		key: "purpleColor",
		name: "Purple",
		description: "Color used by the {p} marker.",
	},
	{
		key: "grayColor",
		name: "Gray",
		description: "Color used by the {gray} marker.",
	},
];

export class StyleObmdSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: StyleObmdPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Highlight decoration")
			.setDesc("Add horizontal padding and rounded corners to highlights.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.highlightDecoration)
					.onChange(async (value) => {
						await this.plugin.setHighlightDecoration(value);
					}),
			);

		new Setting(containerEl).setName("Colors").setHeading();
		new Setting(containerEl).setDesc(
			"Each color is used as the full-opacity bold text color and as the highlight background at 30% opacity.",
		);

		for (const colorSetting of COLOR_SETTINGS) {
			new Setting(containerEl)
				.setName(colorSetting.name)
				.setDesc(colorSetting.description)
				.addColorPicker((colorPicker) =>
					colorPicker
						.setValue(
							this.plugin.settings[colorSetting.key],
						)
						.onChange(async (value) => {
							await this.plugin.setColor(
								colorSetting.key,
								value,
							);
						}),
				);
		}

		new Setting(containerEl).setName("Reset").setHeading();

		new Setting(containerEl)
			.setName("Reset colors")
			.setDesc("Restore all marker colors to their default values.")
			.addButton((button) =>
				button.setButtonText("Reset colors").onClick(async () => {
					await this.plugin.resetColors();
					this.display();
				}),
			);
	}
}
