# resleriana-db

This repository stores Atelier Resleriana data in four languages and hosts an API for it on Vercel.

## Table of Contents

- [Respository structure](#repository-structure)
- [Data](#data)
- [API](#api)
- [Contributing](#contributing)

## Repository structure
- /api - Contains the 
- /data - 
- /import - Contains the scripts needed to parse out data from masterdata into a slightly more human-readable data format.
- main.js - Contains the main searching functions used by the API.


## Data

## API



### Basic data retrieval

#### /[dataset]/[language]/[file]/all

#### /[dataset]/[language]/[file]/id/[id]
retrieves the data object that matches the same id

#### /[dataset]/[language]/[file]/name/[name]
retrieves the data object that matches the same name case-insensitive


### Search API

#### [dataset]/search?languages=[languages]&files=[files]&properties=[properties]&query=[query]
search multiple folders and languages

#### [dataset]/[language]/search?files=[files]&properties=[properties]&query=[query]
searchs multiple folders

#### [dataset]/[language]/[file]/search?properties=[properties]&query=[query]

Options
- topResultOnly: default true. 
- numberOfResults: default 3. If topResultOnly is set to false, then this API will return an 

## Contributing

Either open an issue or make a pull request.