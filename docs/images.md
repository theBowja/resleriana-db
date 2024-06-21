# Images

Prerequisite: [Set up local environment](../README.md#local-development).  

You can use the `extractImages` npm run-script to extract all images. TODO describe what it does. it downloads. This run-script can be configured with various options.

Example:
```powershell
npm run extractImages --% -- --imagesOutputFolder "../MyReslerApp/images" --regex "(^STL_P_.*)|(^equipment_.*)|(^battle_tool.*)"
```

Optional arguments:
- [--server](#server)
- [--platform](#platform)
- [--imagesOutputFolder](#imagesoutputfolder)
- [--imageFormat](#imageformat)
- [--skipDownloads](#skipdownloads)
- [--regex](#regex)

### --server

Which server to download Unity bundles from.

Options: "Global" and "Japan"  
Default: "Global"

Example:
```powershell
npm run extractImages --% -- --server "Japan"
```

### --platform

Which platform to download Unity bundles from.

Options: "StandaloneWindows64", "Android", and "iOS"  
Default: "StandaloneWindows64"

The images from "StandaloneWindows64" will be of noticeable higher quality than images from the mobile platforms.

```powershell
npm run extractImages --% -- --platform "Android"
```

### --imagesOutputFolder

Path to the folder where the images will be outputted.

Default: "./resources/[server]/[platform]/Texture2D"

 If it is a relative path, then it will be relative to the current working directory.

```powershell
npm run extractImages --% -- --imagesOutputFolder "./path/to/wherever"
```

### --imageFormat

Format of the image to convert to.

Options: "png" and "webp"  
Default: "webp"

Assets inside Unity bundles are in a compressed format like BC7. They are decompressed into RGBA before being converted into a more common format. This conversion step can be time-consuming, especially for large batches of images. Processing over 2,000 images might take more than a minute.

Currently, png images are double the size of webp images. Webp images will go through lossy conversion. You can change the quality of the conversion by modifying the python script at `./tools/UnityPyScripts/exportAssets.py`.

```powershell
npm run extractImages --% -- --imageFormat "png"
```

### --skipDownloads

Whether or not to skip downloading the catalog and bundles.

Default: false

This is useful for saving time if you've already downloaded the catalog and bundles from running the command previously and know that the game has not been updated since. The script downloads the catalog in order to create a list of Unity bundles that contain Texture2D assets. This is list is saved in the file: `./resources/[server]/[platform]/bundlenames_all_texture2d.txt`. The bundles are then downloaded into the folder: `./resources/[server]/[platform]/bundles`.

```powershell
npm run extractImages --% -- --skipDownloads
```

### --regex

Regex on image name to filter which image to save.

Default: no regex filter

If you are running the command in PowerShell (and maybe others), you will need to prepend the stop-parsing token (`--%`) to the arguments list and add quotes around the regex in order for regex to be passed successfully into the script. Otherwise, characters like '^' will be stripped out.

You can test your regex on the entire list of image names found at `./resources/Global/StandaloneWindows64/filenames_all_texture2d.txt`. The image names for Global/StandaloneWindows64 and Japan/StandaloneWindows64 will be updated in the repository consistently (hopefully).

Sample regex:
- `^equipment_tool.*` - Large, medium, and small icons for equipments.
- `^STL_P_.*_mini` - Chibi images from the Ryza's Challenge event.
- TODO: please help contribute

```powershell
npm run extractImages --% -- --regex "(^STL_P_.*)|(^equipment_.*)|(^battle_tool.*)"
```
