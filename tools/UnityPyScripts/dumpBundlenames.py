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
parser.add_argument("bundle_folder", type=str, help="Path to the folder containing bundles.")
parser.add_argument("output_folder", type=str, nargs="?", help="Path to the folder where to output. If empty, then no files will be written.")
parser.add_argument("-p", "--processes", type=int, help="Number of processes to use for multiprocessing. Use 1 to disable multiprocessing.")
args = parser.parse_args()

counter = None
total = None


def unpack_assets(bundle_name: str):
    asset_types = set()
    file_path = os.path.join(args.bundle_folder, bundle_name)
    # load that file via UnityPy.load
    env = UnityPy.load(file_path)

    # iterate over internal objects
    for obj in env.objects:
        asset_types.add(obj.type.name)

    logMultiCounter()
    return (bundle_name, asset_types)
    
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

def readListFromFile(filepath):
    with open(filepath) as f:
        items = f.readlines()
    items = [item.rstrip() for item in items]
    return items

# Read the list of bundle names to open
if __name__ == "__main__":
    all_entries = os.listdir(args.bundle_folder)
    all_embed_entries = os.listdir(os.path.join(args.bundle_folder, "Embed"))
    input_bundle_names = [entry for entry in all_entries if os.path.isfile(os.path.join(args.bundle_folder, entry))]
    print(f"Found {len(input_bundle_names)} bundles to process")

    input_embed_bundle_names = [entry for entry in all_embed_entries if os.path.isfile(os.path.join(args.bundle_folder, "Embed", entry))]
    print(f"Found {len(input_embed_bundle_names)} embed bundles to process")

    # Add embed bundles to the list
    input_bundle_names += input_embed_bundle_names

    if args.output_folder:
        os.makedirs(args.output_folder, exist_ok = True) 

    counter = multiprocessing.Value('i', 0)

    # Unpack assets
    processesNum = getProcesses()
    start = time.time()
    print("Using " + str(processesNum) + " processes")
    print("This may take a long time")
    if processesNum == 1:
        initProcess(counter, len(input_bundle_names))
        results = list(map(unpack_assets, input_bundle_names))
    else:
        results = multiprocessing.Pool(processes=processesNum, initializer=initProcess, initargs=(counter, len(input_bundle_names))).map(unpack_assets, input_bundle_names)
    end = time.time()
    print() # newline
    print("  Finished export in " + str(end - start) + " seconds")

    # Organize results
    asset_types_dict = {} # { asset type: set of bundle names }
    for result in results:
        bundle_name = result[0]
        for asset_type in result[1]:
            if asset_type not in asset_types_dict:
                asset_types_dict[asset_type] = set([bundle_name])
            else:
                asset_types_dict[asset_type].add(bundle_name)

    # Output asset types with bundle list
    if args.output_folder:
        for asset_type, bundle_names in asset_types_dict.items():
            filepath = os.path.join(args.output_folder, asset_type+".txt")
            outfilenames = list(bundle_names)
            outfilenames.sort()

            # Read existing list and add to output
            if os.path.isfile(filepath):
                existingfilenames = readListFromFile(filepath)
                outfilenames = list(set(outfilenames + existingfilenames))
                outfilenames.sort()

            with open(filepath, "w") as outfile:
                outfile.write("\n".join(outfilenames))
    else:
        print("No output folder to dump bundlenames into")