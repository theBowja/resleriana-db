import os
import json
import argparse
from collections import OrderedDict

import UnityPy

parser = argparse.ArgumentParser(description="Map containers to path hashes.")
parser.add_argument("container_json", type=str, help="Path to the container JSON file.")
parser.add_argument("bundle_folder", type=str, help="Path to the folder containing bundles.")
parser.add_argument("output_json", type=str, nargs="?", default="output.json", help="Path to the output JSON file.")
args = parser.parse_args()

container_map_path = args.container_json

name_map = {}

with open(container_map_path) as f:
    container_map = json.load(f)

def unpack_all_assets(source_folder : str):
    # iterate over all files in source folder
    for root, dirs, files in os.walk(source_folder):
        for file_name in files:
            # generate file_path
            file_path = os.path.join(root, file_name)
            # load that file via UnityPy.load
            env = UnityPy.load(file_path)

            # iterate over internal objects
            for obj in env.objects:
                # process specific object types
                if obj.type.name in ["Texture2D"]:

                    if obj.container in container_map:
                        # print(container_map[obj.container])
                        data = obj.read();
                        name_map[container_map[obj.container]] = data.name

# bundles_path =  "D:/Workspace/Resleriana/resleriana-db/import/tmp"
bundles_path = args.bundle_folder
unpack_all_assets(bundles_path)


# sort by image name
# to_output = OrderedDict()
to_output = OrderedDict(sorted(name_map.items(), key=lambda item: item[1].lower()))


with open(args.output_json, 'w', encoding='utf-8') as f:
    json.dump(to_output, f, indent='\t')