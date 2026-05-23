import { CarpetColor } from '../types';

// These represent "Shade 1" flat surface RGB values for standard map base colors, 
// which corresponds to exactly how carpets render on a 128x128 Minecraft map.
// Based on typical map multiplier of 220/255 for standard flat elevation.
export const CARPET_PALETTE: CarpetColor[] = [
  { id: 'white', name: 'White Carpet', base: [220, 220, 220], hex: '#dcdcdc' },
  { id: 'orange', name: 'Orange Carpet', base: [186, 109, 44], hex: '#ba6d2c' },
  { id: 'magenta', name: 'Magenta Carpet', base: [153, 65, 186], hex: '#9941ba' },
  { id: 'light_blue', name: 'Light Blue Carpet', base: [88, 132, 186], hex: '#5884ba' },
  { id: 'yellow', name: 'Yellow Carpet', base: [197, 197, 44], hex: '#c5c52c' },
  { id: 'lime', name: 'Lime Carpet', base: [109, 176, 21], hex: '#6db015' },
  { id: 'pink', name: 'Pink Carpet', base: [208, 109, 142], hex: '#d06d8e' },
  { id: 'gray', name: 'Gray Carpet', base: [65, 65, 65], hex: '#414141' },
  { id: 'light_gray', name: 'Light Gray Carpet', base: [132, 132, 132], hex: '#848484' },
  { id: 'cyan', name: 'Cyan Carpet', base: [65, 109, 132], hex: '#416d84' },
  { id: 'purple', name: 'Purple Carpet', base: [109, 54, 153], hex: '#6d3699' },
  { id: 'blue', name: 'Blue Carpet', base: [44, 65, 153], hex: '#2c4199' },
  { id: 'brown', name: 'Brown Carpet', base: [88, 65, 44], hex: '#58412c' },
  { id: 'green', name: 'Green Carpet', base: [88, 109, 44], hex: '#586d2c' },
  { id: 'red', name: 'Red Carpet', base: [132, 44, 44], hex: '#842c2c' },
  { id: 'black', name: 'Black Carpet', base: [21, 21, 21], hex: '#151515' },
];
