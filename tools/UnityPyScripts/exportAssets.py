import os
import json
import argparse
from collections import OrderedDict

import UnityPy

parser = argparse.ArgumentParser(description="Export assets.")
parser.add_argument("bundle_names", type=str, help="Path to the file containing list of bundle names to extract.")
parser.add_argument("bundle_folder", type=str, help="Path to the folder containing bundles.")
parser.add_argument("asset_type", type=str, help="Unity asset type to export.")
parser.add_argument("output_folder", type=str, nargs="?", default="output.json", help="Path to the folder where to output.")
args = parser.parse_args()

bundle_names_path = args.bundle_names

name_map = {}

with open(bundle_names_path) as f:
    bundle_names = f.readlines()
bundle_names = [name.rstrip() for name in bundle_names]

def unpack_all_assets(source_folder : str):
    for bundle_name in bundle_names:
        file_path = os.path.join(source_folder, bundle_name)
        # load that file via UnityPy.load
        env = UnityPy.load(file_path)

        # iterate over internal objects
        for obj in env.objects:
            # process specific object types
            if obj.type.name in [args.asset_type]:

                if obj.type.name == "TextAsset":
                    data = obj.read() # parse the object data

                    # create destination path
                    dest = os.path.join(args.output_folder, data.name)
                    with open(dest, "wb") as f:
                        f.write(bytes(data.script))
                        
                elif obj.type.name == "Texture2D" or obj.type.name == "Sprite":
                    data = obj.read() # parse the object data

                # img = data.text
                # img.save(dest)

    # iterate over all files in source folder

    # for root, dirs, files in os.walk(source_folder):
    #     for file_name in files:
    #         # generate file_path
    #         file_path = os.path.join(root, file_name)
    #         # load that file via UnityPy.load
    #         env = UnityPy.load(file_path)

    #         # iterate over internal objects
    #         for obj in env.objects:
    #             # process specific object types
    #             if obj.type.name in ["Texture2D"]:

    #                 if obj.container in container_map:
    #                     # print(container_map[obj.container])
    #                     data = obj.read();
    #                     name_map[container_map[obj.container]] = data.name

unpack_all_assets(args.bundle_folder)