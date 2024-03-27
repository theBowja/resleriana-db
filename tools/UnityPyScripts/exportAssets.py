import os
import re
import json
import argparse
from collections import OrderedDict

import UnityPy

parser = argparse.ArgumentParser(description="Export assets.")
parser.add_argument("bundle_names", type=str, help="Path to the file containing list of bundle names to extract.")
parser.add_argument("bundle_folder", type=str, help="Path to the folder containing bundles.")
parser.add_argument("asset_type", type=str, help="Unity asset type to export.")
parser.add_argument("output_folder", type=str, nargs="?", default="output.json", help="Path to the folder where to output.")
parser.add_argument("-n", "--filename_list", type=str, help="Path to write the JSON file containing the list of file names.")
parser.add_argument("-f", "--image_format", type=str, help="Format of images to output in. Either png or webp. Defaults to webp.")
parser.add_argument("-r", "--regex", type=str, help="Regex to filter on file names.")
args = parser.parse_args()

bundle_names_path = args.bundle_names

filenames = []

with open(bundle_names_path) as f:
    bundle_names = f.readlines()
bundle_names = [name.rstrip() for name in bundle_names]

os.makedirs(args.output_folder, exist_ok = True)
def unpack_all_assets(source_folder : str):
    count = 0
    for bundle_name in bundle_names:
        file_path = os.path.join(source_folder, bundle_name)
        # load that file via UnityPy.load
        env = UnityPy.load(file_path)

        # iterate over internal objects
        for obj in env.objects:
            # process specific object types
            if obj.type.name in [args.asset_type]:

                if obj.type.name in ["TextAsset"]:
                    data = obj.read() # parse the object data
                    if not validateRegex(data.name):
                        continue
                    dest = os.path.join(args.output_folder, data.name)
                    if args.filename_list != None:
                        filenames.append(data.name)

                    with open(dest, "wb") as f:
                        f.write(bytes(data.script))

                elif obj.type.name in ["Texture2D", "Sprite"]:
                    data = obj.read() # parse the object data
                    if not validateRegex(data.name):
                        continue
                    dest = os.path.join(args.output_folder, data.name)
                    dest, ext = os.path.splitext(dest)

                    if args.image_format == "png":
                        dest = dest + ".png"
                        if args.filename_list != None:
                            filenames.append(data.name)

                        data.image.save(dest, 'png') # idk if this is lossy or not

                    else:
                        dest = dest + ".webp"
                        if args.filename_list != None:
                            filenames.append(data.name)

                        # Other webp options: https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html#webp
                        # "exact" will be removed later
                        data.image.save(dest, 'webp', **{ 'exact': True }) # lossy

                    count = count + 1
                    if count%100 == 0:
                        print("Export progress: "+str(count), end="\r")

def validateRegex(filename):
    if args.regex:
        return True if re.search(args.regex, filename) != None else False
    else:
        return True        

import time
start = time.time()
unpack_all_assets(args.bundle_folder)
end = time.time()
print("Completed export in " + str(end - start) + " seconds")

if args.filename_list != None:
    filenames = list(set(filenames)) # remove duplicate names
    filenames.sort()
    with open(args.filename_list, "w") as outfile:
        outfile.write("\n".join(filenames))
        # json.dump(filenames, outfile, indent=0)