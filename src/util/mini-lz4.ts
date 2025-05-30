/* eslint-disable */
/*
MiniLZ4: Minimal LZ4 block decoding and encoding.

based off of node-lz4, https://github.com/pierrec/node-lz4

====
Copyright (c) 2012 Pierre Curto

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
====

changes have the same license
*/


const lz4: any = {};
    
    /**
     * Decode a block. Assumptions: input contains all sequences of a 
     * chunk, output is large enough to receive the decoded data.
     * If the output buffer is too small, an error will be thrown.
     * If the returned value is negative, an error occured at the returned offset.
     *
     * @param {ArrayBufferView} input input data
     * @param {ArrayBufferView} output output data
     * @param {number=} sIdx
     * @param {number=} eIdx
     * @return {number} number of decoded bytes
     * @private
     */
    lz4.uncompress = function (input: Uint8Array, output: Uint8Array, sIdx: number, eIdx: number) {
        sIdx = sIdx || 0
        eIdx = eIdx || (input.length - sIdx)
        // Process each sequence in the incoming data
        for (var i = sIdx, n = eIdx, j = 0; i < n;) {
            var token = input[i++]
    
            // Literals
            var literals_length = (token >> 4)
            if (literals_length > 0) {
                // length of literals
                var l = literals_length + 240
                while (l === 255) {
                    l = input[i++]
                    literals_length += l
                }
    
                // Copy the literals
                var end = i + literals_length
                while (i < end) output[j++] = input[i++]
    
                // End of buffer?
                if (i === n) return j
            }
    
            // Match copy
            // 2 bytes offset (little endian)
            var offset = input[i++] | (input[i++] << 8)
    
            // XXX 0 is an invalid offset value
            if (offset === 0) return j
            if (offset > j) return -(i-2)
    
            // length of match copy
            var match_length = (token & 0xf)
            var l = match_length + 240
            while (l === 255) {
                l = input[i++]
                match_length += l
            }
    
            // Copy the match
            var pos = j - offset // position of the match copy in the current output
            var end = j + match_length + 4 // minmatch = 4
            while (j < end) output[j++] = output[pos++]
        }
    
        return j
    }
    
    var
        maxInputSize	= 0x7E000000
    ,	minMatch		= 4
    // uint32() optimization
    ,	hashLog			= 16
    ,	hashShift		= (minMatch * 8) - hashLog
    ,	hashSize		= 1 << hashLog
    
    ,	copyLength		= 8
    ,	lastLiterals	= 5
    ,	mfLimit			= copyLength + minMatch
    ,	skipStrength	= 6
    
    ,	mlBits  		= 4
    ,	mlMask  		= (1 << mlBits) - 1
    ,	runBits 		= 8 - mlBits
    ,	runMask 		= (1 << runBits) - 1
    
    ,	hasher 			= /* XXX uint32( */ 2654435761 /* ) */
    
    assert(hashShift === 16);
    var hashTable = new Int16Array(1<<16);
    var empty = new Int16Array(hashTable.length);
    
    // CompressBound returns the maximum length of a lz4 block, given it's uncompressed length
    lz4.compressBound = function (isize: number) {
        return isize > maxInputSize
            ? 0
            : (isize + (isize/255) + 16) | 0
    }
    
    /** @param {number=} sIdx
        @param {number=} eIdx */
    lz4.compress = function (src: Uint8Array, dst: Uint8Array, sIdx: number, eIdx: number) {
        hashTable.set(empty);
        return compressBlock(src, dst, 0, sIdx || 0, eIdx || dst.length)
    }
    
    function compressBlock (src: Uint8Array, dst: Uint8Array, pos: number, sIdx: number, eIdx: number) {
        // XXX var Hash = uint32() // Reusable unsigned 32 bits integer
        var dpos = sIdx
        var dlen = eIdx - sIdx
        var anchor = 0
    
        if (src.length >= maxInputSize) throw new Error("input too large")
    
        // Minimum of input bytes for compression (LZ4 specs)
        if (src.length > mfLimit) {
            var n = lz4.compressBound(src.length)
            if ( dlen < n ) throw Error("output too small: " + dlen + " < " + n)
    
            var 
                step  = 1
            ,	findMatchAttempts = (1 << skipStrength) + 3
            // Keep last few bytes incompressible (LZ4 specs):
            // last 5 bytes must be literals
            ,	srcLength = src.length - mfLimit
    
            while (pos + minMatch < srcLength) {
                // Find a match
                // min match of 4 bytes aka sequence
                var sequenceLowBits = src[pos+1]<<8 | src[pos]
                var sequenceHighBits = src[pos+3]<<8 | src[pos+2]
                // compute hash for the current sequence
                var hash = Math.imul(sequenceLowBits | (sequenceHighBits << 16), hasher) >>> hashShift;
                /* XXX Hash.fromBits(sequenceLowBits, sequenceHighBits)
                                .multiply(hasher)
                                .shiftr(hashShift)
                                .toNumber() */
                // get the position of the sequence matching the hash
                // NB. since 2 different sequences may have the same hash
                // it is double-checked below
                // do -1 to distinguish between initialized and uninitialized values
                var ref = hashTable[hash] - 1
                // save position of current sequence in hash table
                hashTable[hash] = pos + 1
    
                // first reference or within 64k limit or current sequence !== hashed one: no match
                if ( ref < 0 ||
                    ((pos - ref) >>> 16) > 0 ||
                    (
                        ((src[ref+3]<<8 | src[ref+2]) != sequenceHighBits) ||
                        ((src[ref+1]<<8 | src[ref]) != sequenceLowBits )
                    )
                ) {
                    // increase step if nothing found within limit
                    step = findMatchAttempts++ >> skipStrength
                    pos += step
                    continue
                }
    
                findMatchAttempts = (1 << skipStrength) + 3
    
                // got a match
                var literals_length = pos - anchor
                var offset = pos - ref
    
                // minMatch already verified
                pos += minMatch
                ref += minMatch
    
                // move to the end of the match (>=minMatch)
                var match_length = pos
                while (pos < srcLength && src[pos] == src[ref]) {
                    pos++
                    ref++
                }
    
                // match length
                match_length = pos - match_length
    
                // token
                var token = match_length < mlMask ? match_length : mlMask
    
                // encode literals length
                if (literals_length >= runMask) {
                    // add match length to the token
                    dst[dpos++] = (runMask << mlBits) + token
                    for (var len = literals_length - runMask; len > 254; len -= 255) {
                        dst[dpos++] = 255
                    }
                    dst[dpos++] = len
                } else {
                    // add match length to the token
                    dst[dpos++] = (literals_length << mlBits) + token
                }
    
                // write literals
                for (var i = 0; i < literals_length; i++) {
                    dst[dpos++] = src[anchor+i]
                }
    
                // encode offset
                dst[dpos++] = offset
                dst[dpos++] = (offset >> 8)
    
                // encode match length
                if (match_length >= mlMask) {
                    match_length -= mlMask
                    while (match_length >= 255) {
                        match_length -= 255
                        dst[dpos++] = 255
                    }
    
                    dst[dpos++] = match_length
                }
    
                anchor = pos
            }
        }
    
        // cannot compress input
        if (anchor == 0) return 0
    
        // Write last literals
        // encode literals length
        literals_length = src.length - anchor
        if (literals_length >= runMask) {
            // add match length to the token
            dst[dpos++] = (runMask << mlBits)
            for (var ln = literals_length - runMask; ln > 254; ln -= 255) {
                dst[dpos++] = 255
            }
            dst[dpos++] = ln
        } else {
            // add match length to the token
            dst[dpos++] = (literals_length << mlBits)
        }
    
        // write literals
        pos = anchor
        while (pos < src.length) {
            dst[dpos++] = src[pos++]
        }
    
        return dpos
    }
    
    lz4.CHUNK_SIZE = 2048; // musl libc does readaheads of 1024 bytes, so a multiple of that is a good idea
    
    
    
export const compressBound = lz4.compressBound;
export const compress = lz4.compress;
export const uncompress = lz4.uncompress;

function assert(condition: boolean, message?: string) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

export function writeUint32(container: Uint8Array, value: number, offset: number) {
    container[offset] = value & 0xFF;
    container[offset + 1] = (value & 0x0000FF00) >> 8;
    container[offset + 2] = (value & 0x00FF0000) >> 16;
    container[offset + 3] = (value & 0xFF000000) >> 24;
    return offset + 4;
}

export function readUint32(container: Uint8Array, offset: number) {
    return (container[offset] & 0x000000FF) |
        ((container[offset + 1] << 8) & 0x0000FF00) |
        ((container[offset + 2] << 16) & 0x00FF0000) |
        ((container[offset + 3] << 24) & 0xFF000000);
}