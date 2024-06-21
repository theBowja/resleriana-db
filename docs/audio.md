# Audio

Prerequisite: [Set up local environment](../README.md#local-development).  

There are two different kinds of AudioClips:
- BGM (background music)
- Voice (voicelines for main story quest)

You can use the `extractBGM` or `extractVoice` npm run-script to extract those audio files

Example:
```powershell
npm run extractBGM --% -- --outputFolder "../MyReslerApp/BGM"
```

Optional arguments:
- [--server](#server)
- [--platform](#platform)
- [--outputFolder](#outputfolder)
- [--doNotWrite](#donotwrite)
- [--processes](#processes)
- [--regex](#regex)

### --server

Which server to download Unity bundles from.

Options: "Global" and "Japan"  
Default: "Global"

Example:
```powershell
npm run extractBGM --% -- --server "Japan"
```

### --platform

Which platform to download Unity bundles from.

Options: "StandaloneWindows64", "Android", and "iOS"  
Default: "StandaloneWindows64"

```powershell
npm run extractBGM --% -- --platform "Android"
```

### --outputFolder

Path to the folder where the audio files will be outputted.

Default: "./resources/[server]/[platform]/SoundSetting" for BGM; "./resources/[server]/[platform]/VoiceSetScriptableObject" for voicelines

```powershell
npm run extractBGM --% -- --outputFolder "../MyReslerApp/BGM"
```

### --doNotWrite

Flag to prevent writing audio files. The option `--outputFolder` will be ignored if this flag is on. 

This can be useful if you add a regex filter and want to re-generate the list of filenames without writing the audio files again. It should reduce the time it takes to run the script drastically.

Default: false

```powershell
npm run extractBGM --% -- --doNotWrite
```

### --processes

Number of processes to use for extracting assets from bundles.

The python extractor uses the multiprocessing library to speed up extracting assets and writing files. The time the script takes to finish executing is reduced linearly for each extra processor added.

Default: os.cpu_count() - 1

```powershell
npm run extractBGM --% -- --processes 4
```

### --regex

Regex on file name to filter which asset to save.

Default: no regex filter

You can test your regex on the entire list of files names found at:
- [/resources/Global/StandaloneWindows64/filenames_all_soundsetting.txt](../resources/Global/StandaloneWindows64/filenames_all_soundsetting.txt)
- [/resources/Global/StandaloneWindows64/bundlenames_cache_voicesetscriptableobject.txt](../resources/Global/StandaloneWindows64/bundlenames_cache_voicesetscriptableobject.txt)
- [/resources/Japan/StandaloneWindows64/filenames_all_soundsetting.txt](../resources/Japan/StandaloneWindows64/filenames_all_soundsetting.txt)
- [/resources/Japan/StandaloneWindows64/bundlenames_cache_voicesetscriptableobject.txt](../resources/Japan/StandaloneWindows64/bundlenames_cache_voicesetscriptableobject.txt)

```powershell
npm run extractBGM --% -- --regex "(^BGM.*_SONG_.*)"
```

