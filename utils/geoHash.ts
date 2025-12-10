//code of the package https://github.com/codediodeio/geofirex
var BASE32_CODES = "0123456789bcdefghjkmnpqrstuvwxyz";
var ENCODE_AUTO = "auto";
var SIGFIG_HASH_LENGTH = [0, 5, 7, 8, 11, 12, 13, 15, 16, 17, 18];

export const encode = function (latitude, longitude, numberOfChars) {
    if (numberOfChars === ENCODE_AUTO) {
        if (typeof latitude === "number" || typeof longitude === "number") {
            throw new Error("string notation required for auto precision.");
        }
        var decSigFigsLat = latitude.split(".")[1].length;
        var decSigFigsLong = longitude.split(".")[1].length;
        var numberOfSigFigs = Math.max(decSigFigsLat, decSigFigsLong);
        numberOfChars = SIGFIG_HASH_LENGTH[numberOfSigFigs];
    } else if (numberOfChars === undefined) {
        numberOfChars = 9;
    }

    var chars: string[] = [],
        bits = 0,
        bitsTotal = 0,
        hash_value = 0,
        maxLat = 90,
        minLat = -90,
        maxLon = 180,
        minLon = -180,
        mid;

    while (chars.length < numberOfChars) {
        if (bitsTotal % 2 === 0) {
            mid = (maxLon + minLon) / 2;
            if (longitude > mid) {
                hash_value = (hash_value << 1) + 1;
                minLon = mid;
            } else {
                hash_value = (hash_value << 1) + 0;
                maxLon = mid;
            }
        } else {
            mid = (maxLat + minLat) / 2;
            if (latitude > mid) {
                hash_value = (hash_value << 1) + 1;
                minLat = mid;
            } else {
                hash_value = (hash_value << 1) + 0;
                maxLat = mid;
            }
        }

        bits++;
        bitsTotal++;
        if (bits === 5) {
            var code = BASE32_CODES[hash_value];
            chars.push(code);
            bits = 0;
            hash_value = 0;
        }
    }
    return chars.join("");
};
