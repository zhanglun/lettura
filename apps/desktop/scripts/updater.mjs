import path from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { arch, platform } from "node:os";
import { getOctokit, context } from "@actions/github";
import * as core from "@actions/core";
import { getPackageJson, buildProject, getInfo, execCommand } from '@tauri-apps/action-core'

console.log("start updater");

function getAssetName(assetPath) {
	const ext = path.extname(assetPath);
	const filename = path.basename(assetPath).replace(ext, "");
	return path.dirname(assetPath).includes(`target${path.sep}debug`)
		? `${filename}-debug${ext}`
		: `${filename}${ext}`;
}

/**
 * 	version: string;
 * 	notes: string;
 * 	releaseId: number;
 * 	artifacts: string[];
 * @param version
 * @param notes
 * @param releaseId
 * @param artifacts
 * @returns {Promise<void>}
 */
export default async function uploadVersionJSON({
	version,
	notes,
	releaseId,
	artifacts,
}) {
	if (process.env.GITHUB_TOKEN === undefined) {
		throw new Error("GITHUB_TOKEN is required");
	}

	const github = getOctokit(process.env.GITHUB_TOKEN);

	const versionFilename = "latest-version.json";
	const versionFile = path.resolve(process.cwd(), versionFilename);
	const versionContent = {
		version,
		notes,
		pub_date: new Date().toISOString(),
		platforms: {},
	};

	const assets = await github.rest.repos.listReleaseAssets({
		owner: context.repo.owner,
		repo: context.repo.repo,
		release_id: releaseId,
	});
	const asset = assets.data.find((e) => e.name === versionFilename);

	if (asset) {
		versionContent.platforms = (
			await (await fetch(asset.browser_download_url)).json()
		).platforms;

		// https://docs.github.com/en/rest/releases/assets#update-a-release-asset
		await github.rest.repos.deleteReleaseAsset({
			owner: context.repo.owner,
			repo: context.repo.repo,
			release_id: releaseId,
			asset_id: asset.id,
		});
	}

	const sigFile = artifacts.find((s) => s.endsWith(".sig"));
	const assetNames = new Set(artifacts.map((p) => getAssetName(p)));
	const downloadUrl = assets.data
		.filter((e) => assetNames.has(e.name))
		.find(
			(s) => s.name.endsWith(".tar.gz") || s.name.endsWith(".zip"),
		)?.browser_download_url;

	if (downloadUrl) {
		// https://github.com/tauri-apps/tauri/blob/fd125f76d768099dc3d4b2d4114349ffc31ffac9/core/tauri/src/updater/core.rs#L856
		versionContent.platforms[
			`${platform().replace("win32", "windows")}-${arch()
				.replace("arm64", "aarch64")
				.replace("x64", "x86_64")
				.replace("amd64", "x86_64")
				.replace("arm", "armv7")
				.replace("x32", "i686")}`
		] = {
			signature: sigFile ? readFileSync(sigFile).toString() : undefined,
			url: downloadUrl,
		};
	}

	writeFileSync(versionFile, JSON.stringify(versionContent, null, 2));

	console.log(`Uploading ${versionFile}...`);

  await updateAssets(releaseId, [{ path: versionFile, arch: '' }])
}

async function updateAssets (releaseId, assets = []) {
  const existingAssets = (
    await github.rest.repos.listReleaseAssets({
      owner: context.repo.owner,
      repo: context.repo.repo,
      release_id: releaseId,
      per_page: 50,
    })
  ).data;

  // Determine content-length for header to upload asset
  const contentLength = (filePath) => fs.statSync(filePath).size;

  for (const asset of assets) {
    const headers = {
      'content-type': 'application/zip',
      'content-length': contentLength(asset.path),
    };

    const assetName = getAssetName(asset.path);

    const existingAsset = existingAssets.find((a) => a.name === assetName);
    if (existingAsset) {
      console.log(`Deleting existing ${assetName}...`);
      await github.rest.repos.deleteReleaseAsset({
        owner: context.repo.owner,
        repo: context.repo.repo,
        asset_id: existingAsset.id,
      });
    }

    console.log(`Uploading ${assetName}...`);

    await github.rest.repos.uploadReleaseAsset({
      headers,
      name: assetName,
      // https://github.com/tauri-apps/tauri-action/pull/45
      // @ts-ignore error TS2322: Type 'Buffer' is not assignable to type 'string'.
      data: fs.readFileSync(asset.path),
      owner: context.repo.owner,
      repo: context.repo.repo,
      release_id: releaseId,
    });
  }
}

async function run() {
  const projectPath = path.resolve(
    process.cwd(),
    core.getInput('projectPath') || process.argv[2]
  )

  let body = core.getInput('releaseBody')
  const info = getInfo(projectPath)

  console.log(process.argv)
  console.log(body)
  console.log(info)
  
  await uploadVersionJSON({ version: info.version, notes: body, releaseId, artifacts });
}

run()
