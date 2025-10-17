import uuid
import pandas as pd # type: ignore
import os
from pymongo import MongoClient # type: ignore
from dotenv import load_dotenv
from uuid import uuid4
from datetime import datetime
from pprint import pprint
import time
import boto3
from botocore.client import Config
from pathlib import Path

def clean_color(color):
    if pd.isna(color):
        return ""
    return color.split(' ')[0].strip()

print("CSV Parser for J.Miller C.C. Project")
print(". . . Starting up . . .")

#GLOBAL VARS AND ENV VARIABLES.
DO_CONNECT = True                           #Global flag for connecting. Leave false for testing. 
CLEAR_DB_FLAG = True                        #Set to false if you do not wish to remove all entires from db before uploading.

#Load ENV variables.
env_path= Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
mongo_url = os.getenv("DATABASE_URL")
client_name = os.getenv("CLIENT_NAME")
#DO Credentials from .env
DO_SPACES_KEY = os.getenv("DO_SPACES_KEY")
DO_SPACES_SECRET = os.getenv("DO_SPACES_SECRET")
DO_SPACE_NAME = os.getenv("DO_SPACE_NAME")
DO_ENDPOINT = os.getenv("DO_ENDPOINT")
DO_FULL_URL_PRE = os.getenv("DO_FULL_URL_PRE")

#Relative Path Variables
base_dir = os.path.dirname(os.path.abspath(__file__))
crystals_path = base_dir + '/excelDocs/crystals.xlsx'   #Replace with your path if manual.
woods_path = base_dir + '/excelDocs/woods.xlsx'         #Replace with your path if manual.
crystals_image_dir = base_dir + '/images/Crystals'
woods_image_dir = base_dir + '/images/Woods'
imageServerURL = 'images/materials/'

#Load excel files for crystals and woods
crystals = pd.ExcelFile(crystals_path)
woods = pd.ExcelFile(woods_path)

crystalData = {}
woodData = {}
crystal_arr = []
wood_arr = []
image_arr = []

tier_map = {
    "*": "Tier 1",
    "**": "Tier 2",
    "***": "Tier 3",
    "****": "Tier 4"
}
tier_map_2 = {
    "#": "Tier 1",
    "##": "Tier 2",
    "###": "Tier 3",
    "####": "Tier 4",
    "##-###": "Tier 4"
}

instock_map = {
    0: "Available", # Change to 'Not Available' when in prod
    1: "Available"
}

#SCRIPT BEGIN 
#Initialization 
print("Loading Crystals Data . . .")
for sheet_name in crystals.sheet_names:
    df = crystals.parse(sheet_name)
    crystalData[sheet_name] = df

print("Loading Woods Data . . .")
for sheet_name in woods.sheet_names:
    df = woods.parse(sheet_name)
    woodData[sheet_name] = df

df1 = crystalData['Crystals by Category']
df2 = woodData['Properties']
print("Crystal Sheets loaded:", list(crystalData.keys()))
print(df1.head())
print("Wood Sheets loaded:", list(crystalData.keys()))
print(df2.head())

# CRYSTALS
print('Creating DataFrame Models . . . ')
print("Creating Crystal Objects:")
print('Working . . . . . ')

for _, row in df1.iterrows():
    if pd.isna(row['Rarity']) or not row['Rarity']:
        continue
    crystal = {
        "guid": str(uuid4()),
        "status": "Available",
        "tier": tier_map.get(row["Rarity"].strip(), ""),
        "colors": [
            row["Color/Appearance #1"] if pd.notna(row["Color/Appearance #1"]) else "", 
            row["Color/Appearance #2"] if pd.notna(row["Color/Appearance #2"]) else "",
            row["Color/Appearance #3"] if pd.notna(row["Color/Appearance #3"]) else "",
            ],
        "crystalName": row['Crystal Name'],
        "crystalCategory": row['Crystal Category'],
        "psychologicalCorrespondence": [
            row["Psychological Correspondence  #1"] if pd.notna(row["Psychological Correspondence  #1"]) else "", 
            row["Psychological Correspondence  #2"] if pd.notna(row["Psychological Correspondence  #2"]) else "",
            row["Psychological Correspondence  #3"] if pd.notna(row["Psychological Correspondence  #3"]) else "",
            ],
        "createdOn": datetime.now(),
        "updatedOn": datetime.now(),
        "clicks": 0,
        #"imageUrls": row["Image"]

    }
    
    #Seen is used here to ensure duplicate colors are not added again.
    seen = set()
    crystal["colors"] = [
        clean_color(tag) for tag in crystal["colors"] 
        if tag and not (clean_color(tag) in seen or seen.add(clean_color(tag)))
    ]
    crystal["colors"] = [tag for tag in crystal["colors"] if tag != '']
    crystal["psychologicalCorrespondence"] = [tag for tag in crystal["psychologicalCorrespondence"] if tag != ""]

    #CRYSTAL IMAGES
    crystal['imageUrls'] = []
    for folder_name in os.listdir(crystals_image_dir):
        #Find folder path
        if(folder_name.strip() == crystal['crystalName'].strip()):
            folder_path = os.path.join(crystals_image_dir, folder_name)
            if not os.path.isdir(folder_path):
                continue    #Folder doesnt exist.
            folder_path = Path(folder_path)
            
            #Attatch each image in the file to a new URL and attatch URLS to the crystal object.
            for image in folder_path.iterdir():
                if image.is_file():
                    ext = image.suffix.lower()
                    rand_name = f"{uuid.uuid4()}{ext}"
                    dest_path = imageServerURL + rand_name

                    image_arr.append((image, dest_path))
                    dest_path = DO_FULL_URL_PRE + dest_path
                    crystal['imageUrls'].append(dest_path)

    #Attatch the crystal to the array.
    crystal_arr.append(crystal)

print('Crystal Dataframe Completed.')

# WOODS
print("Creating Wood Objects:")
print('Working . . . . . ')

for _, row in df2.iterrows():
    if pd.isna(row['Common Name *']) or not row["Common Name *"]:
        continue
    wood = {
        "guid": str(uuid4()),
        "status": instock_map.get(row['In Stock *'], ""),
        "description": row["Metaphysical & Spiritual Description"],
        "tier": tier_map_2.get(row["Rarity, Difficulty Sourcing *"].strip(), ""),
        "colors": [
            row["Color 1 *"] if pd.notna(row["Color 1 *"]) else "", 
            row["Color 2 *"] if pd.notna(row["Color 2 *"]) else "", 
            row["Color 3 *"] if pd.notna(row["Color 3 *"]) else ""
            ],
        "commonName": row["Common Name *"],
        "alternateName1": row["Alternate Name 1 *"],
        "alternateName2": row["Alternate Name 2 *"],
        "scientificName": row["Scientific Name"],
        "brief": row["Metaphysical Brief (for Label Cards)"],
        "jankaHardness": row["Janka Hardness"],
        "treeHeight": row["Tree Height"],
        "trunkDiameter": row["Trunk Diameter"],
        "geographicOrigin": row["Geographic Origin *"],
        "streaksVeins": row["Streaks & Veins *"],
        "texture": row["Texture"],
        "grainPattern": row["Grain Pattern"],
        "metaphysicalTags": [
            row["Metaphysical Tags *"] if pd.notna(row["Metaphysical Tags *"]) else "",
            row["Metaphysical Tags 2 ^"] if pd.notna(row["Metaphysical Tags 2 ^"]) else "",
            row["Metaphysical Tags 3 *"] if pd.notna(row["Metaphysical Tags 3 *"]) else "",
            row["Metaphysical Tags 4 *"] if pd.notna(row["Metaphysical Tags 4 *"]) else ""
            ], 
        "createdOn": datetime.now(),
        "updatedOn": datetime.now(),
        "clicks": 0,
        #"imageUrls": row["Image"]
        }
    
    seen = set()
    wood["colors"] = [
        clean_color(tag) for tag in wood["colors"] 
        if tag and not (clean_color(tag) in seen or seen.add(clean_color(tag)))
    ]
    wood["colors"] = [tag for tag in wood["colors"] if tag != ""]
    wood["metaphysicalTags"] = [tag for tag in wood["metaphysicalTags"] if tag != ""]
    if 'alternateName1' in wood and pd.isna(wood["alternateName1"]):
        del wood["alternateName1"]
    if 'alternateName2' in wood and pd.isna(wood["alternateName2"]):
        del wood["alternateName2"]

    wood['imageUrls'] = []
    for folder_name in os.listdir(woods_image_dir):
        if(folder_name.strip() == wood['commonName'].strip()):
            # Find folder
            folder_path = os.path.join(woods_image_dir, folder_name)
            if not os.path.isdir(folder_path):
                continue    #Folder doesnt exist
            folder_path = Path(folder_path)
            
            #Attatch each image in the file to a new URL and attatch URLS to the wood object.
            for image in folder_path.iterdir():
                if image.is_file():
                    ext = image.suffix.lower()
                    rand_name = f"{uuid.uuid4()}{ext}"
                    dest_path = imageServerURL + rand_name

                    image_arr.append((image, dest_path))
                    dest_path = DO_FULL_URL_PRE + dest_path
                    wood['imageUrls'].append(dest_path)
    #Attatch to array. Same as crystals.
    wood_arr.append(wood)


print('Wood Dataframe Completed.')

#ONLY RUNS WHEN FLAG IS SET.
#THIS WILL CONNECT AND MAKE CHANGES TO THE DATABASE.
if(DO_CONNECT):
    print('Parsing Complete. Establishing Connection:')

    client = MongoClient(mongo_url)
    db = client[client_name]
    crystal_collection = db['crystals']
    wood_collection = db['woods']

    print('Connection Established.')

    if(CLEAR_DB_FLAG):
        print('Clear DB flag is set. Please cancel now if you do not wish to clear the current database. [ CTRL + C ]')
        time.sleep(3)
        print('CLEARING PHOTOS...')
        print('Connecting to Digital Ocean . . .')
        session = boto3.session.Session()
        client = session.client('s3',
                                region_name = 'nyc3',
                                endpoint_url = DO_ENDPOINT,
                                aws_access_key_id=DO_SPACES_KEY,
                                aws_secret_access_key=DO_SPACES_SECRET)
        print('Connected.')

        res = client.list_objects_v2(Bucket=DO_SPACE_NAME, Prefix=imageServerURL)
        if 'Contents' in res:
            for obj in res['Contents']:
                key = obj['Key']
                print(f'Deleting {key}...')
                client.delete_object(Bucket=DO_SPACE_NAME, Key=key)
        print('COMPLETE.')

        print('CLEARING CRYSTALS...')
        crystal_collection.delete_many({})
        print('COMPLETE.')
        print('CLEARING WOODS...')
        wood_collection.delete_many({})
        print('COMPLETE.')

    print('Uploading Images . . .')
    print('Connecting to Digital Ocean . . .')
    session = boto3.session.Session()
    client = session.client('s3',
                            region_name = 'nyc3',
                            endpoint_url = DO_ENDPOINT,
                            aws_access_key_id=DO_SPACES_KEY,
                            aws_secret_access_key=DO_SPACES_SECRET)
    print('Connected.')
    for file_path, file_url in image_arr:
        key = file_url
        client.upload_file(
            Filename=str(file_path),
            Bucket = DO_SPACE_NAME,
            Key = key,
            ExtraArgs={'ACL': 'public-read', 'ContentType': 'image/jpeg'}
        )
        print(f"Uploaded {file_path.name} to {file_url}")


    print('Uploading Crystals . . .')
    for crystalVar in crystal_arr:
        crystal_collection.insert_one(crystalVar)
    print('Complete!')

    print('Uploading Woods . . .')
    for woodsVar in wood_arr:
        wood_collection.insert_one(woodsVar)
    print('Complete!')

    print('All uploads are complete! Check collection For confirmation.')
else:
    print('Connections not enabled. Parser Run is complete.')
