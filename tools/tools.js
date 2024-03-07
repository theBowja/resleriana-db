// This module provides helper functions to run the tools in Node.

const path = require('path');
const execSync = require('child_process').execFileSync;

module.exports = { executeAtelierToolBundleDownload, generateContainerToPathHash };

/**
 * Executes the AtelierTool.exe which downloads and decrypts bundles to the output folder.
 * @param {string} server 
 * @param {string} platform 
 * @param {string} version 
 * @param {string} outputDirectory if relative path, then it is relative to current working directory.
 * @param {string} [bundlePath] if relative path, then it is relative to current working directory.
 */
function executeAtelierToolBundleDownload(server, platform, version, outputDirectory, bundlePath=undefined) {
    const args = [
        path.resolve(__dirname, `./AtelierToolBundleDownload/AtelierTool.dll`),
        'download-bundles', version,
        '--platform', platform,
        '--server', server,
        '--output', path.resolve(process.cwd(), outputDirectory)
    ];

    if (bundlePath) {
        args.push('--bundlepath', path.resolve(process.cwd(), bundlePath));
    }
    
    execSync('dotnet', args, { stdio: 'inherit' });
}

/**
 * 
 * @param {string} container_json if relative path, then it is relative to current working directory.
 * @param {string} bundle_folder if relative path, then it is relative to current working directory.
 * @param {string} output_json if relative path, then it is relative to current working directory.
 */
function generateContainerToPathHash(container_json, bundle_folder, output_json) {
    const exePath = path.resolve(__dirname, `./UnityPyScripts/mapContainerToPathHash.py`);
    container_json = path.resolve(process.cwd(), container_json);
    bundle_folder = path.resolve(process.cwd(), bundle_folder);
    output_json = path.resolve(process.cwd(), output_json);

    const args = [
        exePath,
        container_json,
        bundle_folder,
        output_json
    ];

    execSync(`python`, args, { stdio: 'inherit' });
}