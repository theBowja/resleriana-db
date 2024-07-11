# PathHashMap

Prerequisite: [Set up local environment](../README.md#local-development).  

This npm run-script generates a JSON object that can map still path hashes in masterdata to the names of images extracted from Unity bundles.

Proper argument parsing requires prepending the arguments list with the `--%` stop-parsing token and enclosing strings in quotation marks. An *additional* `--` separator is needed before you can pass optional arguments into npm run-scripts.

Usages:
```powershell
npm run updatePathHashMap
npm run updatePathHashMap --% -- --[OPTION1] [VALUE1] ...
```

| Option | Description | Default Value |
|--------|-------------|---------------|
| `--server` | Specifies the server to download Unity bundles from ("Global" or "Japan") | "Global" |
| `--platform` | Selects the platform to download bundles from ("StandaloneWindows64", "Android", or "iOS") | "StandaloneWindows64" |

### Examples

```powershell
npm run updatePathHashMap --% -- --server "Japan" --platform "Android"
```

### Platform

Different platforms should generate the same path hash map. So it would be best to choose "Android" because the smaller bundles and images would make the script run faster.

### Logs

Logs will mention: `resources is missing [numbers]`. You can ignore this.

### Misc Files

For every version, the path hash map for both Global and Japan will be automatically updated at /resources/[server]/path_hash_to_name.json.
- [/resources/Global/path_hash_to_name.json](../resources/Global/path_hash_to_name.json)
- [/resources/Japan/path_hash_to_name.json](../resources/Japan/path_hash_to_name.json)
