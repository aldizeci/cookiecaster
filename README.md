# CookieCaster 3.0

| Code Coverage Lines |
| ------------------- |
|  ![Lines](https://img.shields.io/badge/lines-5.13%25-red.svg?style=flat)  |

**! STILL UNDER CONSTRUCTION !**

CookieCaster 3.0 is a freely available web application that allows users to draw their own personalized cookie cutters in order to print them later with a 3D printer. It provides validation of the cutter shape and recommends suitable print values (such as wall thickness and height) to prevent designs that would be unsuitable or unstable for 3D printing.

- CookieCaster 3.0: [fhnw-makerverse.github.io](https://fhnw-makerverse.github.io/cookiecaster/)

## Features
- Draw own personalized cookie cutters in order to print them later with a 3D printer
- Upload image per upload and drag & drop to use as background image of the drawboard
- Save drafts and designed cookie cutters locally in the gallery
- Load templates from gallery to drawboard
- Export drawings in cc3 format on your local client and import them later on
- Validation of the cutter shape
- Recommends print values (wall thickness and height)
- Responsive Layout for iPad up to PC

## Differences to CookieCaster 2.0

This is a continuation of the [CookieCaster 2.0](https://www.cs.technik.fhnw.ch/cookiecaster/) project. So here are the main improvements listed:
- Use of React >= 19.2.x
- Components are function based instead of class based
- Repository are more structured
- More use of Bootstrap for resposiveness and web design
- Improved responsiveness
- CI/CD automation with checks, tests, relases and deployment
- Simple redesign of draw page
- Introduction of cc3 file format (Exported shapes)
- Imports of cc3 files
- No server backend
- Hosted on GitHub Pages instead on local server

## Get started

This section explains the most simple way for getting the page run locally, so a developer can contribute and develop on this project. 

### Run CookieCaster 3.0 locally

> **ℹ️ INFO**
>
>Execute all command in the root of the repository

To set up your development environment you need to install all the dependencies defined in package.json.

````shell 
yarn install
````

Start the local vite development server, so you the developer see the changes you are developing.

````
yarn run dev
````

## Installation
This section how to deploy CookieCaster 3.0 manually. 

Normally the deployment (including release) should happen by the CI/CD Pipeline described [here]()

But if there are problems you can deploy it manually

### Deploy CookieCaster 3.0 

1. Build the react website
````shell
yarn run build
````
2. Deploy the page to GitHub Page
````shell
yarn run deploy
````
3. GitHub will deploy a new GitHub Page available on [fhnw-makerverse.github.io](https://fhnw-makerverse.github.io/cookiecaster/)

## Licensing
This project is licensed under the MIT License. See [LICENSE](./LICENSE.txt) file.

## Contribute & Releasing

## Support
