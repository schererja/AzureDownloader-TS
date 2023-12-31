require('dotenv').config();
import * as azdev from 'azure-devops-node-api';
import * as ba from 'azure-devops-node-api/BuildApi';
import { Build } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { PackageData } from 'models/PackageData';
import path = require('path');
import * as fs from 'fs';




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


        await downloadFile(packageToDownload, buildApi, packageTempFileName);




    }
}


async function downloadFile(packageToDownload: PackageData, buildApi: ba.IBuildApi, packageTempFileName: string) {
    console.log(`Downloading ${packageToDownload.DownloadURL}`);
    const stream = await buildApi.getArtifactContentZip(azureProject, packageToDownload.BuildID, packageToDownload.FileName);
    const writeStream = fs.createWriteStream(packageTempFileName);
    new Promise<void>((resolve, reject) => {
        stream.pipe(writeStream)
            .on('finish', () => {
                resolve;
            })
            .on('error', reject);
    });
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
async function main() {
    Promise.resolve(run());
}
main();
