const CRC_TABLE = (() => {
	/** @type {number[]} */
	const table = [];
	for (let i = 0; i < 256; i += 1) {
		let c = i;
		for (let k = 0; k < 8; k += 1) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table.push(c >>> 0);
	}
	return table;
})();

/** @param {Uint8Array} bytes */
function crc32(bytes) {
	let c = 0xffffffff;
	for (let i = 0; i < bytes.length; i += 1) {
		c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
	}
	return (c ^ 0xffffffff) >>> 0;
}

/** @param {number} length */
function makeBuffer(length) {
	const bytes = new Uint8Array(length);
	const view = new DataView(bytes.buffer);
	return { bytes, view };
}

/** @param {Uint8Array[]} chunks */
function concatChunks(chunks) {
	let total = 0;
	for (const chunk of chunks) total += chunk.length;
	const out = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		out.set(chunk, offset);
		offset += chunk.length;
	}
	return out;
}

/**
 * @param {Record<string, string>} files
 * @returns {Blob}
 */
export function createZipBlob(files) {
	const encoder = new TextEncoder();
	/** @type {Uint8Array[]} */
	const localChunks = [];
	/** @type {Uint8Array[]} */
	const centralChunks = [];
	let localOffset = 0;
	let entryCount = 0;

	for (const [path, content] of Object.entries(files)) {
		const normalizedPath = path.replace(/^\/+/, '');
		if (!normalizedPath) continue;
		entryCount += 1;

		const name = encoder.encode(normalizedPath);
		const data = encoder.encode(content ?? '');
		const checksum = crc32(data);

		const local = makeBuffer(30 + name.length);
		local.view.setUint32(0, 0x04034b50, true);
		local.view.setUint16(4, 20, true);
		local.view.setUint16(6, 0, true);
		local.view.setUint16(8, 0, true);
		local.view.setUint16(10, 0, true);
		local.view.setUint16(12, 0, true);
		local.view.setUint32(14, checksum, true);
		local.view.setUint32(18, data.length, true);
		local.view.setUint32(22, data.length, true);
		local.view.setUint16(26, name.length, true);
		local.view.setUint16(28, 0, true);
		local.bytes.set(name, 30);

		localChunks.push(local.bytes, data);

		const central = makeBuffer(46 + name.length);
		central.view.setUint32(0, 0x02014b50, true);
		central.view.setUint16(4, 20, true);
		central.view.setUint16(6, 20, true);
		central.view.setUint16(8, 0, true);
		central.view.setUint16(10, 0, true);
		central.view.setUint16(12, 0, true);
		central.view.setUint16(14, 0, true);
		central.view.setUint32(16, checksum, true);
		central.view.setUint32(20, data.length, true);
		central.view.setUint32(24, data.length, true);
		central.view.setUint16(28, name.length, true);
		central.view.setUint16(30, 0, true);
		central.view.setUint16(32, 0, true);
		central.view.setUint16(34, 0, true);
		central.view.setUint16(36, 0, true);
		central.view.setUint32(38, 0, true);
		central.view.setUint32(42, localOffset, true);
		central.bytes.set(name, 46);
		centralChunks.push(central.bytes);

		localOffset += local.bytes.length + data.length;
	}

	const centralData = concatChunks(centralChunks);
	const end = makeBuffer(22);
	end.view.setUint32(0, 0x06054b50, true);
	end.view.setUint16(4, 0, true);
	end.view.setUint16(6, 0, true);
	end.view.setUint16(8, entryCount, true);
	end.view.setUint16(10, entryCount, true);
	end.view.setUint32(12, centralData.length, true);
	end.view.setUint32(16, localOffset, true);
	end.view.setUint16(20, 0, true);

	const zipData = concatChunks([...localChunks, centralData, end.bytes]);
	return new Blob([zipData], { type: 'application/zip' });
}

/**
 * Extract files from a ZIP blob
 * @param {Blob} blob
 * @returns {Promise<Record<string, string>>}
 */
export async function extractZipBlob(blob) {
	const buffer = new Uint8Array(await blob.arrayBuffer());
	const view = new DataView(buffer.buffer);
	const decoder = new TextDecoder();
	
	/** @type {Record<string, string>} */
	const files = {};
	
	// Find end of central directory record (search backwards)
	let eocdOffset = buffer.length - 22;
	while (eocdOffset >= 0) {
		if (view.getUint32(eocdOffset, true) === 0x06054b50) break;
		eocdOffset--;
	}
	
	if (eocdOffset < 0) {
		throw new Error('Invalid ZIP file: cannot find end of central directory');
	}
	
	const centralDirOffset = view.getUint32(eocdOffset + 16, true);
	const entryCount = view.getUint16(eocdOffset + 8, true);
	
	let offset = centralDirOffset;
	
	for (let i = 0; i < entryCount; i++) {
		if (view.getUint32(offset, true) !== 0x02014b50) {
			throw new Error('Invalid ZIP file: cannot find central directory entry');
		}
		
		const compressionMethod = view.getUint16(offset + 10, true);
		const compressedSize = view.getUint32(offset + 20, true);
		const uncompressedSize = view.getUint32(offset + 24, true);
		const nameLength = view.getUint16(offset + 28, true);
		const extraLength = view.getUint16(offset + 30, true);
		const commentLength = view.getUint16(offset + 32, true);
		const localHeaderOffset = view.getUint32(offset + 42, true);
		
		const name = decoder.decode(buffer.slice(offset + 46, offset + 46 + nameLength));
		
		// Skip directories
		if (!name.endsWith('/')) {
			const localDataOffset = localHeaderOffset + 30 + view.getUint16(localHeaderOffset + 26, true) + view.getUint16(localHeaderOffset + 28, true);
			
			let data;
			if (compressionMethod === 0) {
				// No compression
				data = buffer.slice(localDataOffset, localDataOffset + uncompressedSize);
			} else if (compressionMethod === 8) {
				// Deflate - use DecompressionStream API
				const compressed = buffer.slice(localDataOffset, localDataOffset + compressedSize);
				const ds = new DecompressionStream('deflate-raw');
				const writer = ds.writable.getWriter();
				writer.write(compressed);
				writer.close();
				const reader = ds.readable.getReader();
				/** @type {Uint8Array[]} */
				const chunks = [];
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					chunks.push(value);
				}
				data = concatChunks(chunks);
			} else {
				throw new Error(`Unsupported compression method: ${compressionMethod}`);
			}
			
			files[name] = decoder.decode(data);
		}
		
		offset += 46 + nameLength + extraLength + commentLength;
	}
	
	return files;
}
