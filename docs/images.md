# Images

Prerequisite: [Set up local environment](../README.md#local-development).  

This npm run-script helps download Unity Asset bundles and extracts images from them.

|  Run-script | Type | Unity | Description |
|---|---|---|---|
| `extractImages` | Image | Texture2D | Extracts images |

Proper argument parsing requires prepending the arguments list with the `--%` stop-parsing token and enclosing strings in quotation marks. An *additional* `--` separator is needed before you can pass optional arguments into npm run-scripts.

Usages:
```powershell
npm run extractImages
npm run extractImages --% -- --[OPTION1] [VALUE1] ...
```

| Option | Description | Default Value |
|--------|-------------|---------------|
| `--server` | Specifies the server to download Unity bundles from ("Global" or "Japan") | "Global" |
| `--platform` | Selects the platform to download bundles from ("StandaloneWindows64", "Android", or "iOS") | "StandaloneWindows64" |
| `--imageFormat` | Selects the format for converting extracted images ("png" or "webp") | "webp" |
| `--outputFolder` | Folder where the extracted image files will be written to (default folder depends on server/platform) | "./resources/[server]/[platform]/Texture2D" |
| `--skipOutputFolder` | Skip writing image files (useful for testing regex filters without writing files) | `false` |
| `--skipDownloads` | Skip downloading the catalog and bundles (useful if they're already downloaded by previous script execution) | `false` |
| `--processes` | Sets the number of processes for parallel asset extraction (utilizes python multiprocessing) | `os.cpu_count() - 1` |
| `--regex` | Applies a regular expression to filenames to filter which image files get written into the output folder | No filter |


### Examples

```powershell
npm run extractImages --% -- --outputFolder "../MyReslerApp/images" --regex "(^STL_P_.*)|(^equipment_.*)|(^battle_tool.*)"
```

### Image Format

Assets inside Unity bundles are in a compressed format like BC7. They are decompressed into RGBA before being converted into a more common format. With a large number of images (>2,000), this conversion step can be time-consuming.

Currently, png images are double the size of webp images. Webp images will go through lossy conversion. You can change the quality of the conversion by modifying the python script at `./tools/UnityPyScripts/exportAssets.py`.

### Testing Regex Filters

You can test your regex against the complete list of filenames found in these files:
- [/resources/Global/StandaloneWindows64/filenames/Texture2D.txt](../resources/Global/StandaloneWindows64/filenames/Texture2D.txt)
- [/resources/Japan/StandaloneWindows64/filenames/Texture2D.txt](../resources/Japan/StandaloneWindows64/filenames/Texture2D.txt)

Or you can directly run the script and check the updated filenames list on your local file system:

```powershell
npm run extractImages --% -- --regex "^equipment_tool.*" --skipOutputFolder
```

Sample regex:
- `^equipment_tool.*` - Large, medium, and small icons for equipments.
- `^STL_P_.*_mini` - Chibi images from the Ryza's Challenge event.

Contribute your own regex examples by opening a pull request or sending a message to me on Discord.

### Misc Files

The list of Unity bundles downloaded is located in the /resources folder in the **bundlenames/Texture2D.txt** file.  
The list of extracted image names is located in the /resources folder in the **filenames/Texture2D.txt** file.  
The mapping of masterdata image hashes to image names is located in the /resources folder in the **path_hash_to_name.json** file.  

The following files are automatically updated after every version update:
- [/resources/Global/StandaloneWindows64/bundlenames/Texture2D.txt](./resources/Global/StandaloneWindows64/bundlenames/Texture2D.txt)
- [/resources/Global/StandaloneWindows64/filenames/Texture2D.txt](./resources/Global/StandaloneWindows64/filenames/Texture2D.txt)
- [/resources/Global/path_hash_to_name.txt](./resources/Global/path_hash_to_name.txt)
- [/resources/Japan/StandaloneWindows64/bundlenames/Texture2D.txt](./resources/Japan/StandaloneWindows64/bundlenames/Texture2D.txt)
- [/resources/Japan/StandaloneWindows64/filenames/Texture2D.txt](./resources/Japan/StandaloneWindows64/filenames/Texture2D.txt)
- [/resources/Japan/path_hash_to_name.txt](./resources/Japan/path_hash_to_name.txt)
