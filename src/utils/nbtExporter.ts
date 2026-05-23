import { write, NBTData, Int32 } from 'nbtify';
import type { MaterialFilterValue } from './colors';

// Java Edition 1.21.5 DataVersion. Older clients still load with a warning.
const DATA_VERSION = 4325;

export async function generateStructureNbt(
  blocks: string[],
  width: number,
  height: number,
  materials: MaterialFilterValue,
): Promise<Uint8Array> {
  const isCarpet = materials === 'carpet';

  const palette: { Name: string }[] = [];
  const paletteIndex = new Map<string, number>();
  const getIdx = (name: string) => {
    let i = paletteIndex.get(name);
    if (i === undefined) {
      i = palette.length;
      paletteIndex.set(name, i);
      palette.push({ Name: name });
    }
    return i;
  };

  const cobbleIdx = isCarpet ? getIdx('minecraft:cobblestone') : -1;
  const blockEntries: { pos: Int32[]; state: Int32 }[] = [];

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const item = blocks[py * width + px];
      if (isCarpet) {
        blockEntries.push({
          pos: [new Int32(px), new Int32(0), new Int32(py)],
          state: new Int32(cobbleIdx),
        });
        blockEntries.push({
          pos: [new Int32(px), new Int32(1), new Int32(py)],
          state: new Int32(getIdx(item)),
        });
      } else {
        blockEntries.push({
          pos: [new Int32(px), new Int32(0), new Int32(py)],
          state: new Int32(getIdx(item)),
        });
      }
    }
  }

  const sizeY = isCarpet ? 2 : 1;

  const root = {
    DataVersion: new Int32(DATA_VERSION),
    size: [new Int32(width), new Int32(sizeY), new Int32(height)],
    palette,
    blocks: blockEntries,
    entities: [] as never[],
  };

  return await write(
    new NBTData(root, { rootName: '', endian: 'big', compression: 'gzip' }),
  );
}
