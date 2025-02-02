import os
import re
import json
import argparse
import multiprocessing
import time

import UnityPy

parser = argparse.ArgumentParser(description="Export assets.")
parser.add_argument("bundle_names", type=str, help="Path to the file containing list of bundle names to extract.")
parser.add_argument("bundle_folder", type=str, help="Path to the folder containing bundles.")
parser.add_argument("asset_type", type=str, help="Unity asset type to dump the filenames of.")
parser.add_argument("filename_list", type=str, nargs="?", help="Path to write the JSON file containing the list of extracted file names. If empty, then no file will be written.")
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
                filenames.append(name)

        elif obj.type.name in ["TextAsset", "Texture2D", "Sprite"]:
            data = obj.read() # parse the object data
            if not validateRegex(data.name):
                continue
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

    if args.filename_list:
        filename_dir = os.path.dirname(args.filename_list)
        os.makedirs(filename_dir, exist_ok = True) 

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