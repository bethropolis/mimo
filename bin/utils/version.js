// bin/utils/version.js
// This string is stamped by the `prebuild:mimo` script (tools/stamp-version.js).
// It is a static literal so it survives `bun build --compile` and global installs.
export const VERSION = '2.0.6';

export function getVersion() {
    return VERSION;
}
