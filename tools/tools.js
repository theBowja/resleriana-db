// This module provides helper functions to run the tools in Node.

const path = require('path');
const execSync = require('child_process').execFileSync;

module.exports = { executeAtelierToolBundleDownload };

/**
 * Executes the AtelierTool.exe which downloads and decrypts bundles to the output folder.
 * @param {string} server 
 * @param {string} platform 
 * @param {string} version 
 * @param {string} outputDirectory if relative path, then it is relative to current working directory.
 * @param {string} [bundlePath] if relative path, then it is relative to current working directory.
 */
function executeAtelierToolBundleDownload(server, platform, version, outputDirectory, bundlePath=undefined) {
    const exePath = path.resolve(__dirname, `./AtelierToolBundleDownload/AtelierTool.exe`);
    const args = [
        'download-bundles', version,
        '--platform', platform,
        '--server', server,
        '--output', path.resolve(process.cwd(), outputDirectory)
    ];

    if (bundlePath) {
        args.push('--bundlepath', path.resolve(process.cwd(), bundlePath));
    }
    
    execSync(exePath, args, { stdio: 'inherit' });
}

function generateContainerToPathHash() {

}