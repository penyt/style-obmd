# Style Obmd for Obsidian

[English](README.md) | [繁體中文](README.zh-TW.md)

A simple Obsidian plugin that adds customizable colors to highlights and bold text, with commands to convert the styled Markdown into portable inline HTML.

## Features

- **Colored Highlights**: Add a color key inside standard highlight syntax, such as `=={r}red highlight==`.
- **Colored Bold Text**: Add a color key inside standard bold syntax, such as `**{b}blue text**`.
- **Live Preview and Reading View**: See the colors while editing and reading your notes.
- **Customizable Colors**: Choose the red, orange, yellow, green, blue, purple, and gray colors in the plugin settings.
- **Optional Decoration**: Add horizontal padding and rounded corners to highlights.
- **HTML Conversion**: Convert Style Obmd markers in the current note or across the entire vault to HTML tags with inline styles.

## Usage

Use one of the supported color keys inside braces:

| Color  | Key      | Highlight example         | Bold example             |
| :----- | :------- | :------------------------ | :----------------------- |
| Red    | `{r}`    | `=={r}red highlight==`    | `**{r}red text**`        |
| Orange | `{o}`    | `=={o}orange highlight==` | `**{o}orange text**`     |
| Yellow | `{y}`    | `=={y}yellow highlight==` | `**{y}yellow text**`     |
| Green  | `{g}`    | `=={g}green highlight==`  | `**{g}green text**`      |
| Blue   | `{b}`    | `=={b}blue highlight==`   | `**{b}blue text**`       |
| Purple | `{p}`    | `=={p}purple highlight==` | `**{p}purple text**`     |
| Gray   | `{gray}` | `=={gray}gray highlight==` | `**{gray}gray text**`    |

## Commands

Open the Command palette and run one of the following commands:

| Command                                      | Description                                                        |
| :------------------------------------------- | :----------------------------------------------------------------- |
| **Style Obmd: Convert current note styles to HTML**      | Convert all Style Obmd markers in the active note to inline HTML.  |
| **Style Obmd: Convert all vault styles to HTML**         | Convert Style Obmd markers in every Markdown file in the vault.    |

The conversion commands skip fenced code blocks and inline code.

⚠️ The vault-wide command modifies multiple files and CANNOT be undone from a single editor history. Back up or commit your vault before running it.

## Settings

You can customize the following options in **Settings → Style Obmd**:

| Setting                  | Description                                                                 | Default   |
| :----------------------- | :-------------------------------------------------------------------------- | :-------- |
| **Highlight decoration** | Add horizontal padding and rounded corners to highlights and exported HTML. | On        |
| **Red**                  | Color used by the `{r}` marker.                                             | `#fb4646` |
| **Orange**               | Color used by the `{o}` marker.                                             | `#e9783f` |
| **Yellow**               | Color used by the `{y}` marker.                                             | `#e0ac00` |
| **Green**                | Color used by the `{g}` marker.                                             | `#44cf6e` |
| **Blue**                 | Color used by the `{b}` marker.                                             | `#5389df` |
| **Purple**               | Color used by the `{p}` marker.                                             | `#be75ff` |
| **Gray**                 | Color used by the `{gray}` marker.                                          | `#9e9e9e` |
| **Reset colors**         | Restore all marker colors to their default values.                          | —         |

Each selected color is used at full opacity for bold text and at 30% opacity for highlight backgrounds.

## Installation

### From Community Plugins

_(Once the plugin is approved)_

1. Open **Settings → Community plugins**.
2. Turn off **Restricted mode**.
3. Select **Browse** and search for `Style Obmd`.
4. Select **Install**, then select **Enable**.

### Manual Installation

1. Go to the [Releases](https://github.com/penyt/style-obmd/releases) page.
2. Download `main.js`, `manifest.json`, and `styles.css` from the latest release.
3. Create a folder named `style-obmd` in your vault's plugin folder: `<Vault>/.obsidian/plugins/style-obmd`.
4. Move the downloaded files into that folder.
5. Reload Obsidian and enable the plugin in **Settings → Community plugins**.

## License

[MIT](LICENSE)

## Donate

If you find this plugin helpful, please give me a GitHub star ⭐️ or buy me a coffee ☕️!

<a href="https://www.buymeacoffee.com/penyt" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
