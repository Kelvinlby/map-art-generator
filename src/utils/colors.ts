import { CarpetColor } from '../types';

// Each row is the "Shade 1" flat-surface RGB of a Minecraft map base color,
// computed as floor(baseRGB * 220 / 255) — how blocks at standard flat
// elevation render on a 128x128 map. Source: Minecraft Wiki (Map § Base colors).
// Excludes air (NONE) only. WATER is included via `minecraft:water` and
// classified as non-solid in MATERIAL_FILTERS; the "Full Block" mode opts
// into it, "Full Solid Block" excludes it.
export const CARPET_PALETTE: CarpetColor[] = [
  // Carpets (shade-220 of the 16 colored base colors + SNOW)
  { name: 'White Carpet',      item: 'minecraft:white_carpet',      base: [220, 220, 220], hex: '#dcdcdc' },
  { name: 'Orange Carpet',     item: 'minecraft:orange_carpet',     base: [186, 109, 44],  hex: '#ba6d2c' },
  { name: 'Magenta Carpet',    item: 'minecraft:magenta_carpet',    base: [153, 65, 186],  hex: '#9941ba' },
  { name: 'Light Blue Carpet', item: 'minecraft:light_blue_carpet', base: [88, 132, 186],  hex: '#5884ba' },
  { name: 'Yellow Carpet',     item: 'minecraft:yellow_carpet',     base: [197, 197, 44],  hex: '#c5c52c' },
  { name: 'Lime Carpet',       item: 'minecraft:lime_carpet',       base: [109, 176, 21],  hex: '#6db015' },
  { name: 'Pink Carpet',       item: 'minecraft:pink_carpet',       base: [208, 109, 142], hex: '#d06d8e' },
  { name: 'Gray Carpet',       item: 'minecraft:gray_carpet',       base: [65, 65, 65],    hex: '#414141' },
  { name: 'Light Gray Carpet', item: 'minecraft:light_gray_carpet', base: [132, 132, 132], hex: '#848484' },
  { name: 'Cyan Carpet',       item: 'minecraft:cyan_carpet',       base: [65, 109, 132],  hex: '#416d84' },
  { name: 'Purple Carpet',     item: 'minecraft:purple_carpet',     base: [109, 54, 153],  hex: '#6d3699' },
  { name: 'Blue Carpet',       item: 'minecraft:blue_carpet',       base: [44, 65, 153],   hex: '#2c4199' },
  { name: 'Brown Carpet',      item: 'minecraft:brown_carpet',      base: [88, 65, 44],    hex: '#58412c' },
  { name: 'Green Carpet',      item: 'minecraft:green_carpet',      base: [88, 109, 44],   hex: '#586d2c' },
  { name: 'Red Carpet',        item: 'minecraft:red_carpet',        base: [132, 44, 44],   hex: '#842c2c' },
  { name: 'Black Carpet',      item: 'minecraft:black_carpet',      base: [21, 21, 21],    hex: '#151515' },

  // Wool — full-block counterpart to each carpet (same RGB).
  { name: 'White Wool',      item: 'minecraft:white_wool',      base: [220, 220, 220], hex: '#dcdcdc' },
  { name: 'Orange Wool',     item: 'minecraft:orange_wool',     base: [186, 109, 44],  hex: '#ba6d2c' },
  { name: 'Magenta Wool',    item: 'minecraft:magenta_wool',    base: [153, 65, 186],  hex: '#9941ba' },
  { name: 'Light Blue Wool', item: 'minecraft:light_blue_wool', base: [88, 132, 186],  hex: '#5884ba' },
  { name: 'Yellow Wool',     item: 'minecraft:yellow_wool',     base: [197, 197, 44],  hex: '#c5c52c' },
  { name: 'Lime Wool',       item: 'minecraft:lime_wool',       base: [109, 176, 21],  hex: '#6db015' },
  { name: 'Pink Wool',       item: 'minecraft:pink_wool',       base: [208, 109, 142], hex: '#d06d8e' },
  { name: 'Gray Wool',       item: 'minecraft:gray_wool',       base: [65, 65, 65],    hex: '#414141' },
  { name: 'Light Gray Wool', item: 'minecraft:light_gray_wool', base: [132, 132, 132], hex: '#848484' },
  { name: 'Cyan Wool',       item: 'minecraft:cyan_wool',       base: [65, 109, 132],  hex: '#416d84' },
  { name: 'Purple Wool',     item: 'minecraft:purple_wool',     base: [109, 54, 153],  hex: '#6d3699' },
  { name: 'Blue Wool',       item: 'minecraft:blue_wool',       base: [44, 65, 153],   hex: '#2c4199' },
  { name: 'Brown Wool',      item: 'minecraft:brown_wool',      base: [88, 65, 44],    hex: '#58412c' },
  { name: 'Green Wool',      item: 'minecraft:green_wool',      base: [88, 109, 44],   hex: '#586d2c' },
  { name: 'Red Wool',        item: 'minecraft:red_wool',        base: [132, 44, 44],   hex: '#842c2c' },
  { name: 'Black Wool',      item: 'minecraft:black_wool',      base: [21, 21, 21],    hex: '#151515' },

  // Natural / building blocks (one iconic block per remaining base color).
  { name: 'Grass Block',    item: 'minecraft:grass_block',    base: [109, 153, 48],  hex: '#6d9930' },
  { name: 'Sand',           item: 'minecraft:sand',           base: [213, 201, 140], hex: '#d5c98c' },
  { name: 'Mushroom Stem',  item: 'minecraft:mushroom_stem',  base: [171, 171, 171], hex: '#ababab' },
  { name: 'Ice',            item: 'minecraft:ice',            base: [138, 138, 220], hex: '#8a8adc' },
  { name: 'Iron Block',     item: 'minecraft:iron_block',     base: [144, 144, 144], hex: '#909090' },
  { name: 'Oak Leaves',     item: 'minecraft:oak_leaves',     base: [0, 106, 0],     hex: '#006a00' },
  { name: 'Redstone Block', item: 'minecraft:redstone_block', base: [220, 0, 0],     hex: '#dc0000' },
  { name: 'Water',          item: 'minecraft:water',          base: [55, 55, 220],   hex: '#3737dc' },
  { name: 'Clay',           item: 'minecraft:clay',           base: [141, 144, 158], hex: '#8d909e' },
  { name: 'Dirt',           item: 'minecraft:dirt',           base: [130, 94, 66],   hex: '#825e42' },
  { name: 'Stone',          item: 'minecraft:stone',          base: [96, 96, 96],    hex: '#606060' },
  { name: 'Oak Planks',     item: 'minecraft:oak_planks',     base: [123, 102, 62],  hex: '#7b663e' },
  { name: 'Quartz Block',   item: 'minecraft:quartz_block',   base: [220, 217, 211], hex: '#dcd9d3' },
  { name: 'Gold Block',     item: 'minecraft:gold_block',     base: [215, 205, 66],  hex: '#d7cd42' },
  { name: 'Diamond Block',  item: 'minecraft:diamond_block',  base: [79, 188, 183],  hex: '#4fbcb7' },
  { name: 'Lapis Block',    item: 'minecraft:lapis_block',    base: [63, 110, 220],  hex: '#3f6edc' },
  { name: 'Emerald Block',  item: 'minecraft:emerald_block',  base: [0, 187, 50],    hex: '#00bb32' },
  { name: 'Podzol',         item: 'minecraft:podzol',         base: [111, 74, 42],   hex: '#6f4a2a' },
  { name: 'Netherrack',     item: 'minecraft:netherrack',     base: [96, 1, 0],      hex: '#600100' },

  // Terracotta variants
  { name: 'White Terracotta',      item: 'minecraft:white_terracotta',      base: [180, 152, 138], hex: '#b4988a' },
  { name: 'Orange Terracotta',     item: 'minecraft:orange_terracotta',     base: [137, 70, 31],   hex: '#89461f' },
  { name: 'Magenta Terracotta',    item: 'minecraft:magenta_terracotta',    base: [128, 75, 93],   hex: '#804b5d' },
  { name: 'Light Blue Terracotta', item: 'minecraft:light_blue_terracotta', base: [96, 93, 119],   hex: '#605d77' },
  { name: 'Yellow Terracotta',     item: 'minecraft:yellow_terracotta',     base: [160, 114, 31],  hex: '#a0721f' },
  { name: 'Lime Terracotta',       item: 'minecraft:lime_terracotta',       base: [88, 100, 45],   hex: '#58642d' },
  { name: 'Pink Terracotta',       item: 'minecraft:pink_terracotta',       base: [138, 66, 67],   hex: '#8a4243' },
  { name: 'Gray Terracotta',       item: 'minecraft:gray_terracotta',       base: [49, 35, 30],    hex: '#31231e' },
  { name: 'Light Gray Terracotta', item: 'minecraft:light_gray_terracotta', base: [116, 92, 84],   hex: '#745c54' },
  { name: 'Cyan Terracotta',       item: 'minecraft:cyan_terracotta',       base: [75, 79, 79],    hex: '#4b4f4f' },
  { name: 'Purple Terracotta',     item: 'minecraft:purple_terracotta',     base: [105, 62, 75],   hex: '#693e4b' },
  { name: 'Blue Terracotta',       item: 'minecraft:blue_terracotta',       base: [65, 53, 79],    hex: '#41354f' },
  { name: 'Brown Terracotta',      item: 'minecraft:brown_terracotta',      base: [65, 43, 30],    hex: '#412b1e' },
  { name: 'Green Terracotta',      item: 'minecraft:green_terracotta',      base: [65, 70, 36],    hex: '#414624' },
  { name: 'Red Terracotta',        item: 'minecraft:red_terracotta',        base: [122, 51, 39],   hex: '#7a3327' },
  { name: 'Black Terracotta',      item: 'minecraft:black_terracotta',      base: [31, 18, 13],    hex: '#1f120d' },

  // Nether / End / misc
  { name: 'Crimson Nylium',    item: 'minecraft:crimson_nylium',    base: [163, 41, 42],   hex: '#a3292a' },
  { name: 'Crimson Planks',    item: 'minecraft:crimson_planks',    base: [127, 54, 83],   hex: '#7f3653' },
  { name: 'Crimson Hyphae',    item: 'minecraft:crimson_hyphae',    base: [79, 21, 25],    hex: '#4f1519' },
  { name: 'Warped Nylium',     item: 'minecraft:warped_nylium',     base: [18, 108, 115],  hex: '#126c73' },
  { name: 'Warped Planks',     item: 'minecraft:warped_planks',     base: [50, 122, 120],  hex: '#327a78' },
  { name: 'Warped Hyphae',     item: 'minecraft:warped_hyphae',     base: [74, 37, 53],    hex: '#4a2535' },
  { name: 'Warped Wart Block', item: 'minecraft:warped_wart_block', base: [17, 155, 114],  hex: '#119b72' },
  { name: 'Deepslate',         item: 'minecraft:deepslate',         base: [86, 86, 86],    hex: '#565656' },
  { name: 'Raw Iron Block',    item: 'minecraft:raw_iron_block',    base: [186, 150, 126], hex: '#ba967e' },
  { name: 'Glow Lichen',       item: 'minecraft:glow_lichen',       base: [109, 144, 129], hex: '#6d9081' },
];

export type MaterialFilterValue = 'carpet' | 'full_solid_block' | 'full_block';

const NON_SOLID_ITEMS = new Set<string>(['minecraft:water']);

export const MATERIAL_FILTERS: {
  value: MaterialFilterValue;
  label: string;
  predicate: (item: string) => boolean;
}[] = [
  { value: 'carpet',           label: 'Carpet',           predicate: (item) => item.endsWith('_carpet') },
  { value: 'full_solid_block', label: 'Full Solid Block', predicate: (item) => !item.endsWith('_carpet') && !NON_SOLID_ITEMS.has(item) },
  { value: 'full_block',       label: 'Full Block',       predicate: (item) => !item.endsWith('_carpet') },
];
