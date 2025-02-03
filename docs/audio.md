# Audio

Prerequisite: [Set up local environment](../README.md#local-development).  

These npm run-scripts helps download Unity Asset bundles and extracts audio clips (BGM and voice lines) from them.

|  Run-script | Type | Unity | Description |
|---|---|---|---|
| `extractBGM` | BGM | SoundSetting | Extracts background music |
| `extractVoice` | Voice | VoiceSetScriptableObject | Extracts voice lines for the main story quest |

Proper argument parsing requires prepending the arguments list with the `--%` stop-parsing token and enclosing strings in quotation marks. An *additional* `--` separator is needed before you can pass optional arguments into npm run-scripts.

Usages:
```powershell
npm run extractBGM
npm run extractBGM --% -- --[OPTION1] [VALUE1] ...
npm run extractVoice
npm run extractVoice --% -- --[OPTION1] [VALUE1] ...
```

| Option | Description | Default Value |
|--------|-------------|---------------|
| `--server` | Specifies the server to download Unity bundles from ("Global" or "Japan") | "Global" |
| `--platform` | Selects the platform to download bundles from ("StandaloneWindows64", "Android", or "iOS") | "StandaloneWindows64" |
| `--outputFolder` | Folder where the extracted audio files will be written to (default folder depends on audio clip type and server/platform) | BGM: "/resources/[server]/[platform]/SoundSetting"<br>Voice: "/resources/[server]/[platform]/VoiceSetScriptableObject" |
| `--skipOutputFolder` | Skip writing audio files (useful for testing regex filters without writing files) | `false` |
| `--processes` | Sets the number of processes for parallel asset extraction (utilizes python multiprocessing) | `os.cpu_count() - 1` |
| `--regex` | Applies a regular expression to filenames to filter which audio files get written into the output folder | No filter |

### Examples

```powershell
npm run extractBGM --% -- --outputFolder "../MyResleriApp/BGM"
```

### Testing Regex Filters

You can test your regex against the complete list of filenames found in these files:
- [/resources/Global/StandaloneWindows64/filenames/SoundSetting.txt](../resources/Global/StandaloneWindows64/filenames/SoundSetting.txt) (BGM)
- [/resources/Global/StandaloneWindows64/filenames/VoiceSetScriptableObject.txt](../resources/Global/StandaloneWindows64/filenames/VoiceSetScriptableObject.txt) (Voice)
- [/resources/Japan/StandaloneWindows64/filenames/SoundSetting.txt](../resources/Japan/StandaloneWindows64/filenames/SoundSetting.txt) (BGM)
- [/resources/Japan/StandaloneWindows64/filenames/VoiceSetScriptableObject.txt](../resources/Japan/StandaloneWindows64/filenames/VoiceSetScriptableObject.txt) (Voice)

Or you can directly run the script and check the updated filenames list on your local file system:

```powershell
npm run extractBGM --% -- --regex "(^BGM.*_SONG_.*)" --skipOutputFolder
```
### Misc Files

The list of Unity bundles downloaded for BGM is located in the /resources folder in the **bundlenames_cache_soundsetting.txt** file.  
The list of Unity bundles downloaded for Voicelines is located in the /resources folder in the **bundlenames_cache_voicesetscriptableobject.txt** file.  
The list of extracted BGM filenames is located in the /resources folder in the **filenames_all_soundsetting.txt** file.  
The list of extracted Voiceline filenames is located in the /resources folder in the **filenames_all_voicesetscriptableobject.txt** file.  

The following files are automatically updated after every version update:
- [/resources/Global/StandaloneWindows64/bundlenames/SoundSetting_cache.txt](./resources/Global/StandaloneWindows64/bundlenames/SoundSetting_cache.txt)
- [/resources/Global/StandaloneWindows64/bundlenames/VoiceSetScriptableObject_cache.txt](./resources/Global/StandaloneWindows64/bundlenames/VoiceSetScriptableObject_cache.txt)
- [/resources/Global/StandaloneWindows64/filenames/SoundSetting.txt](./resources/Global/StandaloneWindows64/filenames/SoundSetting.txt)
- [/resources/Global/StandaloneWindows64/filenames/VoiceSetScriptableObject.txt](./resources/Global/StandaloneWindows64/filenames/VoiceSetScriptableObject.txt)
- [/resources/Japan/StandaloneWindows64/bundlenames/SoundSetting_cache.txt](./resources/Japan/StandaloneWindows64/bundlenames/SoundSetting_cache.txt)
- [/resources/Japan/StandaloneWindows64/bundlenames/VoiceSetScriptableObject_cache.txt](./resources/Japan/StandaloneWindows64/bundlenames/VoiceSetScriptableObject_cache.txt)
- [/resources/Japan/StandaloneWindows64/filenames/SoundSetting.txt](./resources/Japan/StandaloneWindows64/filenames/SoundSetting.txt)
- [/resources/Japan/StandaloneWindows64/filenames/VoiceSetScriptableObject.txt](./resources/Japan/StandaloneWindows64/filenames/VoiceSetScriptableObject.txt)
