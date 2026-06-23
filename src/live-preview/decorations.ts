import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
} from "@codemirror/view";

interface EditorExtensionOptions {
	isColorKey: (value: string) => boolean;
	getColorClass: (key: string) => string;
}

interface HighlightRange {
	prefixFrom: number;
	prefixTo: number;
	contentFrom: number;
	contentTo: number;
	suffixFrom: number;
	suffixTo: number;
	cls: string;
}

interface BoldRange {
	keyFrom: number;
	keyTo: number;
	contentFrom: number;
	contentTo: number;
	rangeFrom: number;
	rangeTo: number;
	cls: string;
}

function scanHighlightRanges(
	text: string,
	baseOffset: number,
	options: EditorExtensionOptions,
): HighlightRange[] {
	const ranges: HighlightRange[] = [];
	let position = 0;

	while (position < text.length) {
		const start = text.indexOf("=={", position);
		if (start === -1) break;

		const keyStart = start + 3;
		const closingBrace = text.indexOf("}", keyStart);
		if (closingBrace === -1) break;

		const key = text
			.slice(keyStart, closingBrace)
			.trim()
			.toLowerCase();
		if (!options.isColorKey(key)) {
			position = closingBrace + 1;
			continue;
		}

		const contentStart = closingBrace + 1;
		const end = text.indexOf("==", contentStart);
		if (end === -1) break;

		ranges.push({
			prefixFrom: baseOffset + start,
			prefixTo: baseOffset + contentStart,
			contentFrom: baseOffset + contentStart,
			contentTo: baseOffset + end,
			suffixFrom: baseOffset + end,
			suffixTo: baseOffset + end + 2,
			cls: options.getColorClass(key),
		});
		position = end + 2;
	}

	return ranges;
}

function scanBoldRanges(
	text: string,
	baseOffset: number,
	options: EditorExtensionOptions,
): BoldRange[] {
	const ranges: BoldRange[] = [];
	let position = 0;

	while (position < text.length) {
		const start = text.indexOf("**{", position);
		if (start === -1) break;

		const keyStart = start + 3;
		const closingBrace = text.indexOf("}", keyStart);
		if (closingBrace === -1) break;

		const key = text
			.slice(keyStart, closingBrace)
			.trim()
			.toLowerCase();
		if (!options.isColorKey(key)) {
			position = closingBrace + 1;
			continue;
		}

		const contentStart = closingBrace + 1;
		const end = text.indexOf("**", contentStart);
		if (end === -1) break;

		ranges.push({
			keyFrom: baseOffset + start + 2,
			keyTo: baseOffset + contentStart,
			contentFrom: baseOffset + contentStart,
			contentTo: baseOffset + end,
			rangeFrom: baseOffset + start,
			rangeTo: baseOffset + end + 2,
			cls: options.getColorClass(key),
		});
		position = end + 2;
	}

	return ranges;
}

function buildDecorations(
	view: EditorView,
	options: EditorExtensionOptions,
): DecorationSet {
	const decorations: Array<{
		from: number;
		to: number;
		deco: Decoration;
	}> = [];
	const cursorLine = view.state.doc.lineAt(
		view.state.selection.main.head,
	);

	for (const visibleRange of view.visibleRanges) {
		const text = view.state.doc.sliceString(
			visibleRange.from,
			visibleRange.to,
		);

		for (const range of scanHighlightRanges(
			text,
			visibleRange.from,
			options,
		)) {
			const isOnCursorLine =
				range.prefixFrom <= cursorLine.to &&
				range.suffixTo >= cursorLine.from;

			if (isOnCursorLine) {
				decorations.push({
					from: range.prefixFrom,
					to: range.suffixTo,
					deco: Decoration.mark({
						class: `cmk-mark ${range.cls}`,
					}),
				});
				continue;
			}

			decorations.push({
				from: range.prefixFrom,
				to: range.prefixTo,
				deco: Decoration.mark({ class: "cmk-hide" }),
			});
			if (range.contentFrom < range.contentTo) {
				decorations.push({
					from: range.contentFrom,
					to: range.contentTo,
					deco: Decoration.mark({
						class: `cmk-mark ${range.cls}`,
					}),
				});
			}
			decorations.push({
				from: range.suffixFrom,
				to: range.suffixTo,
				deco: Decoration.mark({ class: "cmk-hide" }),
			});
		}

		for (const range of scanBoldRanges(
			text,
			visibleRange.from,
			options,
		)) {
			const isOnCursorLine =
				range.rangeFrom <= cursorLine.to &&
				range.rangeTo >= cursorLine.from;

			if (!isOnCursorLine) {
				decorations.push({
					from: range.keyFrom,
					to: range.keyTo,
					deco: Decoration.mark({ class: "cmk-hide" }),
				});
			}
			if (range.contentFrom < range.contentTo) {
				decorations.push({
					from: range.contentFrom,
					to: range.contentTo,
					deco: Decoration.mark({
						class: `cmk-bold ${range.cls}`,
					}),
				});
			}
		}
	}

	decorations.sort((first, second) => first.from - second.from);
	const builder = new RangeSetBuilder<Decoration>();
	for (const decoration of decorations) {
		builder.add(
			decoration.from,
			decoration.to,
			decoration.deco,
		);
	}
	return builder.finish();
}

export function createLivePreviewExtension(options: EditorExtensionOptions) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, options);
			}

			update(update: ViewUpdate) {
				if (
					update.docChanged ||
					update.viewportChanged ||
					update.selectionSet
				) {
					this.decorations = buildDecorations(
						update.view,
						options,
					);
				}
			}
		},
		{
			decorations: (plugin) => plugin.decorations,
		},
	);
}
