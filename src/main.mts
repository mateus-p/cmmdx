import { compileSync } from "@mdx-js/mdx";
import * as glob from "glob";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { basename, dirname } from "path";
import { SourceMapGenerator } from "source-map";
import camelCase from "lodash.camelcase";
import upperFirst from "lodash.upperfirst";
import * as Env from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import CustomConsole from "./cons.mjs";

export interface Configuration {
  outDir?: string;
  input?: string;
  /**
   * Compatible with NodeJS Env
   */
  cleanOutput?: "true" | "false";
}

Env.config({
  path: resolve(process.cwd(), ".cmmdx"),
});

let {
  OUT_DIR: outDir = "./content",
  INPUT: input = "./mdx/*.mdx",
  CLEAN_OUT: cleanOutput = "true",
} = process.env;

export function getConfig(): Required<Configuration> {
  return { input, outDir, cleanOutput: cleanOutput as "true" };
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const indexExportTemplate = readFileSync(
  resolve(__dirname, "../templates", "index.tsx")
).toString();

export default function main(
  overrideConfig: Configuration = {},
  customLogger?: typeof console
) {
  const logger = new CustomConsole(customLogger);

  input = overrideConfig.input ?? input;
  outDir = overrideConfig.outDir ?? outDir;
  cleanOutput = overrideConfig.cleanOutput ?? cleanOutput;

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  else if (cleanOutput === "true") {
    logger.info("Cleaning output directory");
    rmSync(outDir, { force: true, recursive: true });
    mkdirSync(outDir, { recursive: true });
  }

  const matches = glob.default.sync(input);

  if (matches.length === 0)
    return logger.important(`no files found for glob '${input}'`);

  const exportz: { name: string; file: string }[] = [];

  logger.info(`files found: ${matches.length}; compiling...`);

  for (const match of matches) {
    const content = readFileSync(match).toString();

    const outFile = basename(match) + ".ts";

    const exportzName = upperFirst(camelCase(outFile.replace(".mdx.ts", "")));
    const exportzFile = outFile.replace(".ts", "");

    const { value } = compileSync(content, {
      format: "mdx",
      jsxRuntime: "classic",
      SourceMapGenerator,
    });

    const result = value
      .toString()
      .replace(" MDXContent(", ` ${exportzName}(`)
      .replace("MDXContent;", `${exportzName};`)
      .replace("(props) {", "<K extends MDXK>(props:MDXProps<K>){")
      .replace("(props = {}) {", "<K extends MDXK>(props:MDXProps<K>){")
      .replace("id, component", "id:string, component:boolean");

    exportz.push({
      name: exportzName,
      file: exportzFile,
    });

    writeFileSync(
      `${outDir}/${outFile}`,
      `
    import type { MDXProps, MDXK } from 'cmmdx/mdx.d';
    
    ${result}
    `
    );

    logger.success(`${outDir}/${outFile}; OK`);
  }

  writeFileSync(
    `${outDir}/index.ts`,
    indexExportTemplate
      .replace(
        "//?expo",
        `
          ${exportz
            .map((x) => `import _${x.name} from './${x.file}';`)
            .join("\n")}

          ${exportz
            .map((x) => `export {default as ${x.name}} from './${x.file}'`)
            .join("\n")}
        `
      )
      .replace(
        "//?list",
        exportz.map((x) => `_${x.name} as unknown as FC<any>`).join(",\n")
      )
  );
}

