tb.private.packages = [];

//Array of paths to found package manifests.
tb.private.locatedManifests = ["packages/albums", "packages/artists",
															"packages/songs", "packages/tags", "packages/trackbox"];

// Return a read only copy of installed packages.
tb.packages = function() {
	return tb.copyJSON(tb.private.packages);
};

﻿tb.listPackages = function () {
	var packages = ["songs", "albums", "artists", "tags", "boxes"];
	return packages;
};

//TODO: Remove once package system is up.
tb.packageStartup = function () {
	var packages = tb.listPackages();
	for (var packs in packages) {
		var packPath = "packages/" + packages[packs] + "/startup.js";

		tb.getFileContents(packPath, function (script) {
			script = '<script type="text/javascript">' + script;
			script += '</' + 'script>';
			$("head").append(script);
		});
	}
};

// Check a package manifest to make sure it is valid
tb.isPackageManifestValid = function (manifest) {
	if (typeof manifest !== 'object') {
		console.error("Manifest must be a valid JSON object.");
		return false;
	}

	if (!('name' in manifest)) {
		console.error("'name' key required.");
		return false;
	}

	if (manifest.type === "page") {
		if (!('pageName' in manifest)) {
			console.error("'pageName' key required.");
			return false;
		}

		if (!('page' in manifest)) {
			console.error("'page' key required.");
			return false;
		}

		if (!('url' in manifest)) {
			console.error("'url' key required.");
			return false;
		}
	} else if (manifest.type === "shell") {
		if (!('shell' in manifest)) {
			console.error("'shell' key required.");
			return false;
		}
	} else {
		console.error("You must set a valid package type (page, shell) in the manifest file.");
		return false;
	}

	return true;
};

tb.loadPackages = function () {
	var completedPackages = 0;
	var totalPackages = tb.private.locatedManifests.length;

	for(var manifest in tb.private.locatedManifests) {
		tb.findPackage({"file" : tb.private.locatedManifests[manifest]}, false, function(data) {
			if(data === null) {
				tb.getJSONFileContents(tb.private.locatedManifests[manifest] + "/manifest.json", function(data) {
					if (tb.isPackageManifestValid(data)) {
						data.location = tb.private.locatedManifests[manifest];
						data.id = data.name;
						tb.private.packages.push(data);
						completedPackages++;

						// If every package has been loaded trigger onPackagesLoaded event.
						if(completedPackages >= totalPackages) {
							tb.triggerOnPackagesLoaded();
						}
					}
				});
			}
		});
	}
};

// Find a package and return its details.
// Paramerters filters the returned objects, where each item in the JSON object is checked against every songs metadata.
// quantityToReturn is the number of packages to return. Useful if you know the an attribute, like id, is unique, so you can stop after finding a match.
// contains will return a package if part of the string matches, instead requiring two identical strings.
tb.findPackage = function (parameters, contains, callback, quantityToReturn) {
	var packages = tb.packages();
	var matchedPackages = [];

	setTimeout(function () {
		function stringMatches(stringOne, stringTwo) {
			if (contains) {
				if (stringTwo.search(stringOne) >= 0) {
					return true;
				} else {
					return false;
				}
			} else {
					if (stringOne === stringTwo) {
						return true;
					} else {
						return false;
					}
				}
		}

		for(var package in packages) {
			var matched = true;

			if (parameters.name && packages[package].name && matched !== false) {
				if (!stringMatches(parameters.name, packages[package].name)) {
					matched = false;
				}
			}

			if (parameters.id && packages[package].id && matched !== false) {
				if (!stringMatches(parameters.id, packages[package].id)) {
					matched = false;
				}
			}

			if (parameters.location && packages[package].location && matched !== false) {
				if (!stringMatches(parameters.location, packages[package].location)) {
					matched = false;
				}
			}

			if (parameters.description && matched !== false) {
				if (packages[package].description === undefined || !stringMatches(parameters.description, packages[package].description)) {
					matched = false;
				}
			}

			if (parameters.page && packages[package].page && matched !== false) {
				if (packages[package].page === undefined || !stringMatches(parameters.page, packages[package].page)) {
					matched = false;
				}
			}

			if (parameters.shell && packages[package].shell && matched !== false) {
				if (packages[package].shell === undefined || !stringMatches(parameters.shell, packages[package].shell)) {
					matched = false;
				}
			}

			if (parameters.pageIcon  && matched !== false) {
				if (packages[package].pageIcon === undefined || !stringMatches(parameters.pageIcon, packages[package].pageIcon)) {
					matched = false;
				}
			}

			if (parameters.pageName && packages[package].pageName && matched !== false) {
				if (!stringMatches(parameters.pageName, packages[package].pageName)) {
					matched = false;
				}
			}

			if (parameters.type && matched !== false) {
				if (!stringMatches(parameters.type, packages[package].type)) {
					matched = false;
				}
			}

			if (parameters.url && matched !== false) {
				if (packages[package].url === undefined ||!stringMatches(parameters.url, packages[package].url)) {
					matched = false;
				}
			}

			if ( matched === true ) {
				matchedPackages.push(tb.copyJSON(packages[package]));
				if ( matchedPackages.length >= (quantityToReturn || Number.MAX_VALUE)) {
					break;
				}
			}
		}

		if (matchedPackages.length > 0 ) {
			callback(matchedPackages);
		} else {
			callback(null);
		}
	}, 0);
};
