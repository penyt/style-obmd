import { Notice, Plugin } from "obsidian";
import {
	ColorPalette,
	convertDocumentToHtml,
} from "../conversion/converter";
import { ConfirmVaultConversionModal } from "./confirm-vault-conversion-modal";

interface CommandOptions {
	isHighlightDecorationEnabled: () => boolean;
	getColors: () => ColorPalette;
}

export function registerCommands(
	plugin: Plugin,
	options: CommandOptions,
): void {
	registerCurrentNoteCommand(plugin, options);
	registerVaultCommand(plugin, options);
}

function registerCurrentNoteCommand(
	plugin: Plugin,
	options: CommandOptions,
): void {
	plugin.addCommand({
		id: "convert-current-note-styles-to-html",
		name: "Convert current note styles to HTML",
		editorCallback: (editor) => {
			const source = editor.getValue();
			const result = convertDocumentToHtml(
				source,
				options.isHighlightDecorationEnabled(),
				options.getColors(),
			);

			if (result.count === 0) {
				new Notice("No style obmd markup found in the current note.");
				return;
			}

			editor.transaction(
				{
					changes: [
						{
							from: { line: 0, ch: 0 },
							to: editor.offsetToPos(source.length),
							text: result.text,
						},
					],
				},
				"style-obmd-convert-to-html",
			);
			new Notice(`Converted ${result.count} style markers to HTML.`);
		},
	});
}

function registerVaultCommand(
	plugin: Plugin,
	options: CommandOptions,
): void {
	let conversionRunning = false;

	plugin.addCommand({
		id: "convert-vault-styles-to-html",
		name: "Convert all vault styles to HTML",
		callback: () => {
			if (conversionRunning) {
				new Notice("Vault conversion is already running.");
				return;
			}

			const files = plugin.app.vault.getMarkdownFiles();
			new ConfirmVaultConversionModal(
				plugin.app,
				files.length,
				async () => {
					conversionRunning = true;
					const progressNotice = new Notice(
						"Converting vault styles to HTML…",
						0,
					);
					let convertedFiles = 0;
					let convertedMarkers = 0;
					let failedFiles = 0;
					const includeDecoration =
						options.isHighlightDecorationEnabled();
					const colors = options.getColors();

					try {
						for (const file of files) {
							try {
								let markerCount = 0;
								await plugin.app.vault.process(
									file,
									(source) => {
										const result =
											convertDocumentToHtml(
												source,
												includeDecoration,
												colors,
											);
										markerCount = result.count;
										return result.text;
									},
								);
								if (markerCount === 0) continue;

								convertedFiles += 1;
								convertedMarkers += markerCount;
							} catch (error) {
								failedFiles += 1;
								console.error(
									`Style Obmd could not convert ${file.path}.`,
									error,
								);
							}
						}
					} finally {
						conversionRunning = false;
						progressNotice.hide();
					}

					const failureMessage =
						failedFiles > 0
							? ` ${failedFiles} files failed; see the developer console.`
							: "";
					new Notice(
						`Converted ${convertedMarkers} style markers in ${convertedFiles} files.${failureMessage}`,
						8000,
					);
				},
			).open();
		},
	});
}
