import type { Compiler, WebpackPluginInstance } from "webpack";
import { Configuration } from "./build/main.mjs";

declare class CMMDXPlugin implements WebpackPluginInstance {
  constructor(customConfig?: Configuration);

  apply(compiler: Compiler): void;
}

export = CMMDXPlugin;

