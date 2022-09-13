const { sync } = require("glob");
const { resolve, dirname } = require("path");

const main = import("./build/main.mjs");

const pluginName = "cmmdx-webpack-plugin";

module.exports = class CMMDXPlugin {
  /**
   *
   * @param {import('./build/main.mjs').Configuration} customConfig
   */
  constructor(customConfig = {}) {
    this.customConfig = customConfig;
  }

  /**
   *
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    const logger = compiler.getInfrastructureLogger(pluginName);

    const hooks = [compiler.hooks.watchRun, compiler.hooks.beforeRun];

    hooks.forEach((hook) => {
      hook.tapPromise(pluginName, async () => {
        try {
          (await main).default(
            { cleanOutput: "false", ...this.customConfig },
            logger
          );
        } catch (err) {
          logger.error(err);
        }
      });
    });

    compiler.hooks.afterCompile.tapPromise(pluginName, async (compilation) => {
      const { input } = (await main).getConfig();

      const mdxFiles = new Set(sync(input).map(dirname));

      for (const file of mdxFiles) {
        const resolvedFile = resolve(file);

        if (!compilation.contextDependencies.has(resolvedFile))
          compilation.contextDependencies.add(resolvedFile);
      }
    });
  }
};

