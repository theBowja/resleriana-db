import os
import re
import json
import argparse
import multiprocessing
import time

import UnityPy

UnityPy.config.FALLBACK_VERSION_WARNED = True
UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.6f1"

parser = argparse.ArgumentParser(description="Export assets.")
parser.add_argument("bundle_names", type=str, help="Path to the file containing list of bundle names to extract.")
parser.add_argument("bundle_folder", type=str, help="Path to the folder containing bundles.")
parser.add_argument("asset_type", type=str, help="Unity asset type to export.")
parser.add_argument("output_folder", type=str, nargs="?", help="Path to the folder where to output. If empty, then no files will be written.")
parser.add_argument("-n", "--filename_list", type=str, help="Path to write the JSON file containing the list of extracted file names.")
parser.add_argument("-b", "--bundlename_list", type=str, help="Path to write the txt file containing the list of bundle names that had something extracted.")
parser.add_argument("-f", "--image_format", type=str, help="Format of images to output in. Either png or webp. Defaults to webp.")
parser.add_argument("-r", "--regex", type=str, help="Regex to filter on file names.")
parser.add_argument("-p", "--processes", type=int, help="Number of processes to use for multiprocessing. Use 1 to disable multiprocessing.")
args = parser.parse_args()

counter = None
total = None

def unpack_assets(bundle_name: str):
    filenames = []
    file_path = os.path.join(args.bundle_folder, bundle_name)
    # load that file via UnityPy.load
    env = UnityPy.load(file_path)

    # iterate over internal objects
    for obj in env.objects:
        if obj.type.name != args.asset_type:
            continue

        if obj.type.name == "AudioClip":
            clip = obj.read()
            for name, data in clip.samples.items():
                if name.startswith('SE_') or not validateRegex(name): # skip sound effect files
                    continue
                if args.output_folder:
                    dest = os.path.join(args.output_folder, name)
                    with open(dest, "wb") as f:
                        f.write(data)
                filenames.append(name)

        elif obj.type.name == "TextAsset":
            data = obj.read() # parse the object data
            if not validateRegex(data.name):
                continue
            if args.output_folder:
                dest = os.path.join(args.output_folder, data.name)
                with open(dest, "wb") as f:
                    f.write(bytes(data.script))
            filenames.append(data.name)

        elif obj.type.name in ["Texture2D", "Sprite"]:
            data = obj.read() # parse the object data
            if not validateRegex(data.name):
                continue

            if args.output_folder:
                dest = os.path.join(args.output_folder, data.name)
                dest, ext = os.path.splitext(dest)

                if args.image_format == "png":
                    dest = dest + ".png"
                    data.image.save(dest, 'png') # idk if this is lossy or not
                else:
                    dest = dest + ".webp"
                    # Other webp options: https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html#webp
                    # "exact" will be removed later
                    data.image.save(dest, 'webp', **{ 'exact': True }) # lossy

            filenames.append(data.name)

    logMultiCounter()
    return filenames

def validateRegex(filename):
    if args.regex:
        return True if re.search(args.regex, filename) != None else False
    else:
        return True
    
def getProcesses():
    if args.processes != None:
        return args.processes
    return multiprocessing.cpu_count()-1 or 1

def logMultiCounter():
    with counter.get_lock():
        counter.value += 1
        if counter.value % 10 == 0 or counter.value == total:
            print("", end=f"\rProcessed {counter.value}/{total} bundles")

def initProcess(c, t):
    global counter
    global total
    counter = c
    total = t

# Read the list of bundle names to open
if __name__ == "__main__": 
    with open(args.bundle_names) as f:
        bundle_names = f.readlines()
    bundle_names = [name.rstrip() for name in bundle_names]

    if args.output_folder:
        os.makedirs(args.output_folder, exist_ok = True) 

    counter = multiprocessing.Value('i', 0)

    # Unpack assets
    processesNum = getProcesses()
    start = time.time()
    print("Using " + str(processesNum) + " processes")
    print("This may take a long time")
    if processesNum == 1:
        initProcess(counter, len(bundle_names))
        results = list(map(unpack_assets, bundle_names))
    else:
        results = multiprocessing.Pool(processes=processesNum, initializer=initProcess, initargs=(counter, len(bundle_names))).map(unpack_assets, bundle_names)
    end = time.time()
    print() # newline
    print("  Finished export in " + str(end - start) + " seconds")

    # Post
    if args.filename_list != None:
        outfilenames = list(set([fname for fnames in results for fname in fnames])) # flatten, then remove duplicate names
        outfilenames.sort()
        dest, ext = os.path.splitext(args.filename_list)
        if ext == "json":
            json.dump(outfilenames, args.filename_list, indent=0)
        else: # txt maybe
            with open(args.filename_list, "w") as outfile:
                outfile.write("\n".join(outfilenames))

    if args.bundlename_list != None:
        bundlename_out = list(set([bundle_names[idx] for idx, fnames in enumerate(results) if fnames])) # flatten, then remove duplicate names
        bundlename_out.sort()
        dest, ext = os.path.splitext(args.bundlename_list)
        if ext == "json":
            json.dump(bundlename_out, args.bundlename_list, indent=0)
        else: # txt maybe
            with open(args.bundlename_list, "w") as outfile:
                outfile.write("\n".join(bundlename_out))