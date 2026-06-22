export type ColorKey = "r" | "o" | "y" | "g" | "b" | "p" | "gray";
export type ColorPalette = Record<ColorKey, string>;

const COLOR_KEY_PATTERN = "r|o|y|g|b|p|gray";
const HIGHLIGHT_PATTERN = new RegExp(
	`==\\{(${COLOR_KEY_PATTERN})\\}(.*?)==`,
	"gi",
);
const BOLD_PATTERN = new RegExp(
	`\\*\\*\\{(${COLOR_KEY_PATTERN})\\}(.*?)\\*\\*`,
	"gi",
);

export interface ConversionResult {
	text: string;
	count: number;
}

function hexToRgba(hex: string, alpha: number): string {
	const normalized = hex.replace("#", "");
	const red = Number.parseInt(normalized.slice(0, 2), 16);
	const green = Number.parseInt(normalized.slice(2, 4), 16);
	const blue = Number.parseInt(normalized.slice(4, 6), 16);
	return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function convertStyledText(
	text: string,
	includeHighlightDecoration: boolean,
	colors: ColorPalette,
): ConversionResult {
	let count = 0;
	const decoration = includeHighlightDecoration
		? " padding: 0 0.12em; border-radius: 0.2em;"
		: "";

	const highlights = text.replace(
		HIGHLIGHT_PATTERN,
		(_match, rawKey: string, content: string) => {
			const key = rawKey.toLowerCase() as ColorKey;
			count += 1;
			return `<mark style="background-color: ${hexToRgba(colors[key], 0.3)}; color: inherit;${decoration}">${content}</mark>`;
		},
	);

	const bold = highlights.replace(
		BOLD_PATTERN,
		(_match, rawKey: string, content: string) => {
			const key = rawKey.toLowerCase() as ColorKey;
			count += 1;
			return `<strong style="color: ${colors[key]};">${content}</strong>`;
		},
	);

	return { text: bold, count };
}

function convertOutsideInlineCode(
	line: string,
	includeHighlightDecoration: boolean,
	colors: ColorPalette,
): ConversionResult {
	let output = "";
	let count = 0;
	let position = 0;

	while (position < line.length) {
		const opening = line.indexOf("`", position);
		if (opening === -1) {
			const result = convertStyledText(
				line.slice(position),
				includeHighlightDecoration,
				colors,
			);
			output += result.text;
			count += result.count;
			break;
		}

		const openingMatch = line.slice(opening).match(/^`+/);
		if (!openingMatch) break;

		const delimiter = openingMatch[0];
		const closing = line.indexOf(delimiter, opening + delimiter.length);
		const beforeCode = convertStyledText(
			line.slice(position, opening),
			includeHighlightDecoration,
			colors,
		);
		output += beforeCode.text;
		count += beforeCode.count;

		if (closing === -1) {
			output += line.slice(opening);
			break;
		}

		const codeEnd = closing + delimiter.length;
		output += line.slice(opening, codeEnd);
		position = codeEnd;
	}

	return { text: output, count };
}

export function convertDocumentToHtml(
	source: string,
	includeHighlightDecoration: boolean,
	colors: ColorPalette,
): ConversionResult {
	const convertedLines: string[] = [];
	let count = 0;
	let fenceCharacter = "";
	let minimumFenceLength = 0;

	for (const line of source.split("\n")) {
		const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/);

		if (fenceCharacter) {
			convertedLines.push(line);
			if (
				fenceMatch &&
				fenceMatch[1]?.startsWith(fenceCharacter) &&
				fenceMatch[1].length >= minimumFenceLength
			) {
				fenceCharacter = "";
				minimumFenceLength = 0;
			}
			continue;
		}

		if (fenceMatch?.[1]) {
			fenceCharacter = fenceMatch[1][0] ?? "";
			minimumFenceLength = fenceMatch[1].length;
			convertedLines.push(line);
			continue;
		}

		const result = convertOutsideInlineCode(
			line,
			includeHighlightDecoration,
			colors,
		);
		convertedLines.push(result.text);
		count += result.count;
	}

	return {
		text: convertedLines.join("\n"),
		count,
	};
}
