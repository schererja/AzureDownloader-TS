require('dotenv').config();
import * as azdev from 'azure-devops-node-api';
import * as ba from 'azure-devops-node-api/BuildApi';
import { Build } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { PackageData } from 'models/PackageData';
import path = require('path');
import * as fs from 'fs';
import extract = require('extract-zip');
import fetch from 'node-fetch'


console.log("Gathering configurations...");
const tempDirectory = process.env.TEMP_DIR;
const azureOrganization = process.env.AZURE_ORG_NAME;
const azureProject = process.env.AZURE_PROJECT;
const azurePAT = process.env.AZURE_PAT;
const zipLocation = process.env.ZIP_LOCATION;

const orgUrl = `https://dev.azure.com/${azureOrganization}`;
const token: string = azurePAT;

const authHandler = azdev.getPersonalAccessTokenHandler(token);
const connection = new azdev.WebApi(orgUrl, authHandler);
async function run() {
    const buildApi = await connection.getBuildApi();

    const build: ba.IBuildApi = await connection.getBuildApi();
    const foundBuilds: Build[] = await build.getBuilds(azureProject)
    let buildsFound: PackageData[] = [];
    for (const foundBuild of foundBuilds) {
        console.log(`Gathering artifacts from ${foundBuild.definition.name}`);
        if (foundBuild.sourceBranch.includes("main") && foundBuild.sourceBranch.includes("master")) {
            continue;
        }
        const artifacts = await build.getArtifacts(azureProject, foundBuild.id);
        let packageData: PackageData = {
            PackageName: foundBuild.definition.name,
            BuildID: foundBuild.id,

        };
        for (const artifact of artifacts) {
            if (artifact.name.includes("Code")) {
                continue;
            }
            if (!artifact.name.includes("$")) {
                packageData.DownloadURL = artifact.resource.downloadUrl;
                if (artifact.name.includes(".zip")) {
                    packageData.FileName = artifact.name;
                }
                else {
                    packageData.FileName = artifact.name + ".zip";
                }
            } else {
                packageData.FileName = null;
            }
        }
        if (packageData.FileName == null) {
            continue;
        }
        console.log(`Adding ${packageData.FileName}`);
        buildsFound.push(packageData);
    }
    if (buildsFound.length == 0) {
        console.log("No builds found");
        return;
    }
    for (let buildFound in buildsFound) {
        console.log(`Building ${buildsFound[buildFound].FileName}`);
        let packageToDownload = buildsFound[buildFound];
        const packageTempDirectory = tempDirectory +
            path.sep +
            packageToDownload.PackageName +
            path.sep;
        const packageTempFileName = packageTempDirectory +
            packageToDownload.FileName;
        const packageTempFolderOutput = packageTempDirectory +
            path.sep +
            "output" +
            path.sep;

        const packageReleaseFolder = zipLocation +
            path.sep +
            "release" +
            path.sep;
        const packageReleaseFileNameFolder = packageReleaseFolder +
            packageToDownload.PackageName +
            path.sep;
        await createDirectories([packageTempDirectory, packageReleaseFolder, packageReleaseFileNameFolder, packageTempFolderOutput])

        // if (!fs.existsSync(packageTempFileName)) {
        console.log(`Downloading ${packageToDownload.DownloadURL}`);
        const stream = await buildApi.getArtifactContentZip(azureProject, packageToDownload.BuildID, packageToDownload.FileName);
        const writeStream = fs.createWriteStream(packageTempFileName);
        new Promise<void>((resolve, reject) => {
            stream.pipe(writeStream)
                .on('finish', resolve)
                .on('error', reject);
        });


    }


}


async function downloadFile(url: string, destinationPath: string): Promise<void> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to download file (status ${response.status}): ${response.statusText}`);
        }

        const writeStream = fs.createWriteStream(destinationPath);
        const stream = response.body.pipe(writeStream);

        return new Promise<void>((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });
    } catch (error) {
        console.error('Error downloading artifact file:', error);
        throw error;
    }
}
async function createDirectories(directories: string[]) {
    for (const directory of directories) {
        if (!fs.existsSync(directory)) {
            fs.mkdir(directory, { recursive: true }, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        }
    }
}
// Function to unzip a file
async function unzipFile(zipPath: string, destinationPath: string): Promise<void> {
    await extract(zipPath, { dir: destinationPath });
}
async function main() {
    Promise.resolve(run());
}
main();
