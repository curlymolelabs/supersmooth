'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { appRootFromInstallRoot } = require('./install');

function sha256File(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function sha256Base64File(filePath) {
    // AG stores unpadded base64 (no trailing '='). Node's digest('base64')
    // includes padding, so we strip it to match AG's format.
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('base64').replace(/=+$/, '');
}



function updateChecksums(basePath, targets) {
    const appRoot = appRootFromInstallRoot(basePath);
    const productPath = path.join(appRoot, 'product.json');
    const product = JSON.parse(fs.readFileSync(productPath, 'utf8'));
    if (!product.checksums || typeof product.checksums !== 'object') {
        return { updated: 0, productPath };
    }

    let updated = 0;
    for (const target of targets) {
        if (!target.checksumKey || !product.checksums[target.checksumKey]) {
            continue;
        }
        product.checksums[target.checksumKey] = sha256Base64File(target.path);
        updated += 1;
    }

    fs.writeFileSync(productPath, JSON.stringify(product, null, '\t'));
    return { updated, productPath };
}

function checksumMatches(basePath, target) {
    const appRoot = appRootFromInstallRoot(basePath);
    const product = JSON.parse(fs.readFileSync(path.join(appRoot, 'product.json'), 'utf8'));
    const current = product.checksums?.[target.checksumKey];
    if (!current) {
        return false;
    }
    return current === sha256Base64File(target.path);
}

module.exports = {
    checksumMatches,
    sha256File,
    updateChecksums
};
