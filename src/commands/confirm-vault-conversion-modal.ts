import { App, Modal, Setting } from "obsidian";

export class ConfirmVaultConversionModal extends Modal {
	constructor(
		app: App,
		private readonly fileCount: number,
		private readonly onConfirm: () => Promise<void>,
	) {
		super(app);
	}

	onOpen(): void {
		this.setTitle("Convert vault styles to HTML");

		const description = this.contentEl.createEl("p");
		description.appendText("This will update up to ");
		description.createEl("strong", {
			text: String(this.fileCount),
		});
		description.appendText(
			" Markdown files. This bulk operation cannot be undone from a single editor history.",
		);
		this.contentEl.createEl("p", {
			text: "Back up or commit your vault before continuing.",
		});

		new Setting(this.contentEl)
			.addButton((button) =>
				button.setButtonText("Cancel").onClick(() => this.close()),
			)
			.addButton((button) =>
				button
					.setButtonText("Convert vault")
					.setWarning()
					.onClick(() => {
						this.close();
						void this.onConfirm();
					}),
			);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
