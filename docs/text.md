# Text

Prerequisite: [Set up local environment](../README.md#local-development).  

These npm run-scripts helps download Unity Asset bundles and extracts text files from them.

|  Run-script | Type | Unity | Description |
|---|---|---|---|
| `extractText` | Text | TextAsset | Extracts text |

Proper argument parsing requires prepending the arguments list with the `--%` stop-parsing token and enclosing strings in quotation marks. An *additional* `--` separator is needed before you can pass optional arguments into npm run-scripts.

Usages:
```powershell
npm run extractText
npm run extractText --% -- --[OPTION1] [VALUE1] ...
```

| Option | Description | Default Value |
|--------|-------------|---------------|
| `--server` | Specifies the server to download Unity bundles from ("Global" or "Japan") | "Global" |
| `--platform` | Selects the platform to download bundles from ("StandaloneWindows64", "Android", or "iOS") | "StandaloneWindows64" |
| `--outputFolder` | Folder where the extracted audio files will be written to (default folder depends on server) | "/resources/[server]/TextAsset" |
| `--processes` | Sets the number of processes for parallel asset extraction (utilizes python multiprocessing) | `os.cpu_count() - 1` |

### Examples

```powershell
npm run extractText --% -- --outputFolder "../MyResleriApp/Text"
```

### Misc Files

For every version, the text assets for both Global and Japan will be automatically updated at /resources/[server]/TextAsset.