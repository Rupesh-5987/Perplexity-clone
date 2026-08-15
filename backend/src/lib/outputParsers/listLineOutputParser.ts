import { BaseOutputParser } from "@langchain/core/output_parsers";

interface ListLineOutputParserArgs {
  key?: string;
}

// Pulls newline-separated items out of <key>...</key> XML tags.
export class ListLineOutputParser extends BaseOutputParser<string[]> {
  static lc_name() {
    return "ListLineOutputParser";
  }

  lc_namespace = ["langchain", "output_parsers", "list_line"];
  key: string;

  constructor(args: ListLineOutputParserArgs = {}) {
    super();
    this.key = args.key ?? "suggestions";
  }

  async parse(text: string): Promise<string[]> {
    const regex = new RegExp(`<${this.key}>([\\s\\S]*?)<\\/${this.key}>`, "i");
    const match = text.match(regex);
    if (!match) return [];
    return match[1]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  getFormatInstructions(): string {
    return `Respond with items wrapped in <${this.key}> and </${this.key}> tags, one item per line.`;
  }
}
