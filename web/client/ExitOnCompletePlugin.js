class ExitOnCompletePlugin {
    apply(compiler) {
        compiler.hooks.done.tap('ExitOnCompletePlugin', (stats) => {
            if (!stats.hasErrors()) {
                console.log('Build completed successfully. Exiting process...');
                process.exit(0);
            } else {
                console.log('Build completed with errors.');
                process.exit(1);
            }
        });
    }
}

module.exports = ExitOnCompletePlugin;