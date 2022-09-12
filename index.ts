#!/usr/bin/env node

import { compile } from "@mdx-js/mdx";
import * as glob from "glob";
import { copyFile, mkdir, readFile, rm, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { basename, dirname } from "path";
import { SourceMapGenerator } from "source-map";
import camelCase from "lodash.camelcase";
import upperFirst from "lodash.upperfirst";
import { config } from "dotenv";
import { promisify } from "util";
import { resolve } from "path";
import logSymbols from "log-symbols";
import { fileURLToPath } from "url";

config({
  path: resolve(process.cwd(), ".cmmdx"),
});

const __dirname = dirname(fileURLToPath(import.meta.url));

const {
  OUT_DIR: outDir = "./content",
  INPUT: input = "./mdx/*.mdx",
  CLEAN_OUT: cleanOutput = "true",
} = process.env;

const globP = promisify(glob.default);

function info(message: string) {
  console.log(logSymbols.info, message);
  console.log();
}

function error(err: string | Error) {
  console.error(logSymbols.error, error);
  console.log();
}

function success(message: string) {
  console.log(logSymbols.success, message);
  console.log();
}

async function main() {
  const indexExportTemplate = (
    await readFile(resolve(__dirname, "index.tsx"))
  ).toString();

  if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });
  else if (cleanOutput === "true") {
    info("Cleaning output directory");
    await rm(outDir, { force: true, recursive: true });
    await mkdir(outDir, { recursive: true });
  }

  const matches = await globP(input);

  if (matches.length === 0) return info("no files found; exiting");

  const exportz: { name: string; file: string }[] = [];

  info(`files found: ${matches.length}; compiling...`);

  for (const match of matches) {
    const content = await readFile(match);

    const outFile = basename(match) + ".ts";

    const exportzName = upperFirst(camelCase(outFile.replace(".mdx.ts", "")));
    const exportzFile = outFile.replace(".ts", "");

    const { value } = await compile(content, {
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

    await writeFile(
      `${outDir}/${outFile}`,
      `
    import { MDXProps, MDXK } from './index.d';
    
    ${result}
    `
    );

    success(`${outDir}/${outFile}; OK`);
  }

  await writeFile(
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

  await copyFile(
    resolve(__dirname, "index.d.ts"),
    resolve(outDir, "index.d.ts")
  );
}

main().catch((err) => {
  error(err);
  process.exit(1);
});

