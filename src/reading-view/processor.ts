interface ReadingViewOptions {
	isColorKey: (value: string) => boolean;
	getColorClass: (key: string) => string;
}

function transformRenderedHighlights(
	element: HTMLElement,
	options: ReadingViewOptions,
): void {
	for (const mark of Array.from(element.querySelectorAll("mark"))) {
		const match = (mark.textContent ?? "").match(
			/^\{([a-z]+)\}(.*)$/i,
		);
		if (!match?.[1] || match[2] === undefined) continue;

		const key = match[1].toLowerCase();
		if (!options.isColorKey(key)) continue;

		mark.className = `cmk-mark ${options.getColorClass(key)}`;
		mark.textContent = match[2];
	}
}

function transformRenderedBold(
	element: HTMLElement,
	options: ReadingViewOptions,
): void {
	const doc = element.ownerDocument;

	for (const strong of Array.from(element.querySelectorAll("strong"))) {
		const match = (strong.textContent ?? "").match(
			/^\{([a-z]+)\}/i,
		);
		if (!match?.[0] || !match[1]) continue;

		const key = match[1].toLowerCase();
		if (!options.isColorKey(key)) continue;

		const walker = doc.createTreeWalker(
			strong,
			NodeFilter.SHOW_TEXT,
		);
		const firstText = walker.nextNode() as Text | null;
		if (!firstText?.nodeValue?.startsWith(match[0])) continue;

		firstText.nodeValue = firstText.nodeValue.slice(match[0].length);
		strong.classList.add("cmk-bold", options.getColorClass(key));
	}
}

function transformPlainTextHighlights(
	element: HTMLElement,
	options: ReadingViewOptions,
): void {
	const doc = element.ownerDocument;
	const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	const nodes: Text[] = [];
	let node: Node | null;

	while ((node = walker.nextNode())) nodes.push(node as Text);

	for (const textNode of nodes) {
		const raw = textNode.nodeValue ?? "";
		if (!raw.includes("=={")) continue;

		const fragment = doc.createDocumentFragment();
		let position = 0;

		while (position < raw.length) {
			const start = raw.indexOf("=={", position);
			if (start === -1) {
				fragment.appendChild(doc.createTextNode(raw.slice(position)));
				break;
			}

			if (start > position) {
				fragment.appendChild(
					doc.createTextNode(raw.slice(position, start)),
				);
			}

			const keyStart = start + 3;
			const closingBrace = raw.indexOf("}", keyStart);
			if (closingBrace === -1) {
				fragment.appendChild(doc.createTextNode(raw.slice(start)));
				break;
			}

			const key = raw
				.slice(keyStart, closingBrace)
				.trim()
				.toLowerCase();
			if (!options.isColorKey(key)) {
				fragment.appendChild(
					doc.createTextNode(raw.slice(start, closingBrace + 1)),
				);
				position = closingBrace + 1;
				continue;
			}

			const contentStart = closingBrace + 1;
			const end = raw.indexOf("==", contentStart);
			if (end === -1) {
				fragment.appendChild(doc.createTextNode(raw.slice(start)));
				break;
			}

			const mark = doc.createElement("mark");
			mark.className = `cmk-mark ${options.getColorClass(key)}`;
			mark.textContent = raw.slice(contentStart, end);
			fragment.appendChild(mark);
			position = end + 2;
		}

		textNode.parentNode?.replaceChild(fragment, textNode);
	}
}

export function transformReadingView(
	element: HTMLElement,
	options: ReadingViewOptions,
): void {
	transformRenderedHighlights(element, options);
	transformRenderedBold(element, options);
	transformPlainTextHighlights(element, options);
}
