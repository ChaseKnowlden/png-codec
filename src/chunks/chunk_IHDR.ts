/**
 * @license
 * Copyright (c) 2022 Daniel Imms <http://www.growingwiththeweb.com>
 * Released under MIT license. See LICENSE in the project root for details.
 */

import { assertChunkCompressionMethod, assertChunkDataLengthEquals, ChunkError, handleWarning } from '../assert.js';
import { BitDepth, ChunkPartByteLength, ColorType, IPngHeaderDetails, InterlaceMethod, IPngChunk, IDecodeContext, IDecodePngOptions } from '../types.js';

/**
 * `IHDR` Image Header
 *
 * Spec: https://www.w3.org/TR/PNG/#11IHDR
 *
 * The IHDR (Image Header) chunk contains critical information about the image such as its
 * dimensions and bit depth, this information is used when looking at later chunks and it's required
 * that this chunk is the first chunk in the datastream.
 */
export function parseChunk_IHDR(ctx: IDecodeContext, chunk: IPngChunk): IPngHeaderDetails { // eslint-disable-line @typescript-eslint/naming-convention
  assertChunkDataLengthEquals(ctx, chunk, 13);

  let offset = chunk.offset + ChunkPartByteLength.Length + ChunkPartByteLength.Type;
  const width = ctx.view.getUint32(offset); offset += 4;
  const height = ctx.view.getUint32(offset); offset += 4;
  const bitDepth = ctx.view.getUint8(offset++);
  const colorType = ctx.view.getUint8(offset++);
  const compressionMethod = ctx.view.getUint8(offset++);
  const filterMethod = ctx.view.getUint8(offset++);
  const interlaceMethod = ctx.view.getUint8(offset++);

  if (!isValidBitDepth(bitDepth)) {
    throw new ChunkError(chunk, `Bit depth "${bitDepth}" is not valid`);
  }
  // TODO: This check doesn't apply if the image has a palette
  // if (!isValidColorType(colorType, bitDepth)) {
  //   throw new ChunkError(chunk, `Color type "${colorType}" is not valid with bit depth "${bitDepth}"`);
  // }
  assertChunkCompressionMethod(ctx, chunk, compressionMethod);
  if (filterMethod !== 0) {
    handleWarning(ctx, new ChunkError(chunk, `Filter method "${filterMethod}" is not valid`));
  }
  if (!isValidInterlaceMethod(interlaceMethod)) {
    handleWarning(ctx, new ChunkError(chunk, `Interlace method "${interlaceMethod}" is not valid`));
  }

  return {
    width,
    height,
    bitDepth,
    colorType,
    interlaceMethod
  };
}

function isValidBitDepth(bitDepth: number): bitDepth is BitDepth {
  return (
    bitDepth === 1 ||
    bitDepth === 2 ||
    bitDepth === 4 ||
    bitDepth === 8 ||
    bitDepth === 16
  );
}

function isValidColorType(colorType: number, bitDepth: number): colorType is ColorType {
  return (
    (colorType === 0 && bitDepth >= 1 && bitDepth <= 8) ||
    (colorType === 2 && bitDepth >= 1 && bitDepth <= 16) ||
    (colorType === 3 && bitDepth >= 8 && bitDepth <= 16) ||
    (colorType === 4 && bitDepth >= 8 && bitDepth <= 16) ||
    (colorType === 6 && bitDepth >= 8 && bitDepth <= 16)
  );
}

function isValidInterlaceMethod(interlaceMethod: number): interlaceMethod is InterlaceMethod {
  return (
    interlaceMethod === 0 ||
    interlaceMethod === 1
  );
}
