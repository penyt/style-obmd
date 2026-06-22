import { Plugin } from "obsidian";
import {
	EditorView,
	Decoration,
	DecorationSet,
	ViewPlugin,
	ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

type Key = "r" | "o" | "y" | "g" | "b" | "p" | "gray";

const KEY_TO_CLASS: Record<Key, string> = {
	r: "cmk-r",
	o: "cmk-o",
	y: "cmk-y",
	g: "cmk-g",
	b: "cmk-b",
	p: "cmk-p",
	gray: "cmk-gray",
};

function isAllowedKey(s: string): s is Key {
	return (
		s === "r" ||
		s === "o" ||
		s === "y" ||
		s === "g" ||
		s === "b" ||
		s === "p" ||
		s === "gray"
	);
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

/**
 * scan the range, find ==[key]content==
 * returm the prefix, content, and suffix ranges
 */
function scanRange(text: string, baseOffset: number): HighlightRange[] {
	const out: HighlightRange[] = [];
	let i = 0;

	while (i < text.length) {
		// search for "==["
		const start = text.indexOf("==[", i);
		if (start === -1) break;

		const keyStart = start + 3; // after "==["
		const rb = text.indexOf("]", keyStart);
		if (rb === -1) break;

		const key = text.slice(keyStart, rb).trim().toLowerCase();
		if (!isAllowedKey(key)) {
			i = rb + 1;
			continue;
		}

		const contentStart = rb + 1;

		// search for the ending "=="
		const end = text.indexOf("==", contentStart);
		if (end === -1) break;

		out.push({
			prefixFrom: baseOffset + start,
			prefixTo: baseOffset + contentStart,
			contentFrom: baseOffset + contentStart,
			contentTo: baseOffset + end,
			suffixFrom: baseOffset + end,
			suffixTo: baseOffset + end + 2,
			cls: KEY_TO_CLASS[key],
		});

		i = end + 2;
	}

	return out;
}

/**
 * Scan the range and find **[key]content**.
 */
function scanBoldRange(text: string, baseOffset: number): BoldRange[] {
	const out: BoldRange[] = [];
	let i = 0;

	while (i < text.length) {
		const start = text.indexOf("**[", i);
		if (start === -1) break;

		const keyStart = start + 3;
		const rb = text.indexOf("]", keyStart);
		if (rb === -1) break;

		const key = text.slice(keyStart, rb).trim().toLowerCase();
		if (!isAllowedKey(key)) {
			i = rb + 1;
			continue;
		}

		const contentStart = rb + 1;
		const end = text.indexOf("**", contentStart);
		if (end === -1) break;

		out.push({
			keyFrom: baseOffset + start + 2,
			keyTo: baseOffset + contentStart,
			contentFrom: baseOffset + contentStart,
			contentTo: baseOffset + end,
			rangeFrom: baseOffset + start,
			rangeTo: baseOffset + end + 2,
			cls: KEY_TO_CLASS[key],
		});

		i = end + 2;
	}

	return out;
}

function buildDecorations(view: EditorView): DecorationSet {
	const decorations: Array<{ from: number; to: number; deco: Decoration }> =
		[];

	// get the cursor line range
	const cursorPos = view.state.selection.main.head;
	const cursorLine = view.state.doc.lineAt(cursorPos);
	const cursorLineFrom = cursorLine.from;
	const cursorLineTo = cursorLine.to;

	for (const vr of view.visibleRanges) {
		const from = vr.from;
		const to = vr.to;

		// only get the visible text
		const slice = view.state.doc.sliceString(from, to);

		const items = scanRange(slice, from);
		for (const it of items) {
			// check if this highlight is on the cursor line
			const isOnCursorLine =
				it.prefixFrom <= cursorLineTo && it.suffixTo >= cursorLineFrom;

			if (isOnCursorLine) {
				// cursor is on this line, only color it, don't hide
				decorations.push({
					from: it.prefixFrom,
					to: it.suffixTo,
					deco: Decoration.mark({ class: `cmk-mark ${it.cls}` }),
				});
			} else {
				// cursor is not on this line, hide the syntax markers
				// hide the prefix ==[key]
				decorations.push({
					from: it.prefixFrom,
					to: it.prefixTo,
					deco: Decoration.mark({ class: "cmk-hide" }),
				});
				// content coloring
				if (it.contentFrom < it.contentTo) {
					decorations.push({
						from: it.contentFrom,
						to: it.contentTo,
						deco: Decoration.mark({ class: `cmk-mark ${it.cls}` }),
					});
				}
				// hide the suffix ==
				decorations.push({
					from: it.suffixFrom,
					to: it.suffixTo,
					deco: Decoration.mark({ class: "cmk-hide" }),
				});
			}
		}

		const boldItems = scanBoldRange(slice, from);
		for (const it of boldItems) {
			const isOnCursorLine =
				it.rangeFrom <= cursorLineTo && it.rangeTo >= cursorLineFrom;

			if (!isOnCursorLine) {
				decorations.push({
					from: it.keyFrom,
					to: it.keyTo,
					deco: Decoration.mark({ class: "cmk-hide" }),
				});
			}

			if (it.contentFrom < it.contentTo) {
				decorations.push({
					from: it.contentFrom,
					to: it.contentTo,
					deco: Decoration.mark({ class: `cmk-bold ${it.cls}` }),
				});
			}
		}
	}

	// RangeSetBuilder needs to be sorted by from
	decorations.sort((a, b) => a.from - b.from);
	const builder = new RangeSetBuilder<Decoration>();
	for (const d of decorations) {
		builder.add(d.from, d.to, d.deco);
	}

	return builder.finish();
}

function makeEditorPlugin() {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view);
			}

			update(update: ViewUpdate) {
				if (
					update.docChanged ||
					update.viewportChanged ||
					update.selectionSet
				) {
					this.decorations = buildDecorations(update.view);
				}
			}
		},
		{
			decorations: (v) => v.decorations,
		},
	);
}

function transformReadingView(el: HTMLElement) {
	const doc = el.ownerDocument;

	// First, process the mark elements wrapped by Obsidian highlight
	const marks = Array.from(el.querySelectorAll("mark"));
	for (const mark of marks) {
		const raw = mark.textContent ?? "";
		// Check if it matches the [key]content format
		const match = raw.match(/^\[([a-z]+)\](.*)$/i);
		if (match && match[1] && match[2] !== undefined) {
			const key = match[1].toLowerCase();
			const content = match[2];
			if (isAllowedKey(key)) {
				mark.className = `cmk-mark ${KEY_TO_CLASS[key]}`;
				mark.textContent = content;
			}
		}
	}

	// Process **[key]content** rendered as a strong element.
	const strongElements = Array.from(el.querySelectorAll("strong"));
	for (const strong of strongElements) {
		const raw = strong.textContent ?? "";
		const match = raw.match(/^\[([a-z]+)\]/i);
		if (!match?.[0] || !match[1]) continue;

		const key = match[1].toLowerCase();
		if (!isAllowedKey(key)) continue;

		const walker = doc.createTreeWalker(
			strong,
			NodeFilter.SHOW_TEXT,
		);
		const firstText = walker.nextNode() as Text | null;
		if (!firstText?.nodeValue?.startsWith(match[0])) continue;

		firstText.nodeValue = firstText.nodeValue.slice(match[0].length);
		strong.classList.add("cmk-bold", KEY_TO_CLASS[key]);
	}

	// Then, process the plain text nodes (the cases not handled by Obsidian highlight)
	const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
	const nodes: Text[] = [];
	let n: Node | null;

	while ((n = walker.nextNode())) nodes.push(n as Text);

	for (const tn of nodes) {
		const raw = tn.nodeValue ?? "";
		if (!raw.includes("==[")) continue;

		const frag = doc.createDocumentFragment();
		let i = 0;

		while (i < raw.length) {
			const start = raw.indexOf("==[", i);
			if (start === -1) {
				frag.appendChild(doc.createTextNode(raw.slice(i)));
				break;
			}

			if (start > i)
				frag.appendChild(doc.createTextNode(raw.slice(i, start)));

			const keyStart = start + 3;
			const rb = raw.indexOf("]", keyStart);
			if (rb === -1) {
				frag.appendChild(doc.createTextNode(raw.slice(start)));
				break;
			}

			const key = raw.slice(keyStart, rb).trim().toLowerCase();
			if (!isAllowedKey(key)) {
				frag.appendChild(
					doc.createTextNode(raw.slice(start, rb + 1)),
				);
				i = rb + 1;
				continue;
			}

			const contentStart = rb + 1;
			const end = raw.indexOf("==", contentStart);
			if (end === -1) {
				frag.appendChild(doc.createTextNode(raw.slice(start)));
				break;
			}

			const content = raw.slice(contentStart, end);

			const mark = doc.createElement("mark");
			mark.className = `cmk-mark ${KEY_TO_CLASS[key]}`;
			mark.textContent = content;

			frag.appendChild(mark);
			i = end + 2;
		}

		tn.parentNode?.replaceChild(frag, tn);
	}
}

export default class StyleObmdPlugin extends Plugin {
	async onload() {
		// Live Preview
		this.registerEditorExtension(makeEditorPlugin());
		// Reading view
		this.registerMarkdownPostProcessor((el) => transformReadingView(el));
	}
}
