export interface Plant {
  id: string
  name: string
  price: number
  light: 'low' | 'medium' | 'bright'
  petSafe: boolean
  care: 'easy' | 'fussy'
  hue: number // leaf hue for the glyph
  leaves: number // glyph variation
}

export const PLANTS: Plant[] = [
  { id: 'p1', name: 'Snake plant', price: 32, light: 'low', petSafe: false, care: 'easy', hue: 135, leaves: 3 },
  { id: 'p2', name: 'Calathea', price: 44, light: 'medium', petSafe: true, care: 'fussy', hue: 155, leaves: 4 },
  { id: 'p3', name: 'ZZ plant', price: 38, light: 'low', petSafe: false, care: 'easy', hue: 145, leaves: 5 },
  { id: 'p4', name: 'Parlor palm', price: 29, light: 'low', petSafe: true, care: 'fussy', hue: 128, leaves: 5 },
  { id: 'p5', name: 'Fiddle leaf', price: 78, light: 'bright', petSafe: false, care: 'fussy', hue: 120, leaves: 3 },
  { id: 'p6', name: 'Spider plant', price: 18, light: 'medium', petSafe: true, care: 'easy', hue: 110, leaves: 5 },
  { id: 'p7', name: 'Pothos', price: 22, light: 'low', petSafe: false, care: 'easy', hue: 100, leaves: 4 },
  { id: 'p8', name: 'Boston fern', price: 26, light: 'medium', petSafe: true, care: 'fussy', hue: 118, leaves: 5 },
  { id: 'p9', name: 'Monstera', price: 64, light: 'medium', petSafe: false, care: 'easy', hue: 150, leaves: 3 },
  { id: 'p10', name: 'Peperomia', price: 16, light: 'medium', petSafe: true, care: 'easy', hue: 160, leaves: 4 },
  { id: 'p11', name: 'Bird of paradise', price: 89, light: 'bright', petSafe: false, care: 'fussy', hue: 140, leaves: 3 },
  { id: 'p12', name: 'Cast iron', price: 41, light: 'low', petSafe: true, care: 'easy', hue: 150, leaves: 4 },
  { id: 'p13', name: 'Prayer plant', price: 24, light: 'low', petSafe: true, care: 'fussy', hue: 165, leaves: 4 },
  { id: 'p14', name: 'Jade', price: 19, light: 'bright', petSafe: false, care: 'easy', hue: 125, leaves: 5 },
  { id: 'p15', name: 'Haworthia', price: 12, light: 'bright', petSafe: true, care: 'easy', hue: 138, leaves: 5 },
  { id: 'p16', name: 'Philodendron', price: 36, light: 'medium', petSafe: false, care: 'easy', hue: 105, leaves: 4 },
]

export interface Filter {
  id: string
  label: string
  test: (p: Plant) => boolean
}

export const FILTERS: Filter[] = [
  { id: 'pet', label: 'Pet-safe', test: (p) => p.petSafe },
  { id: 'low', label: 'Low light', test: (p) => p.light === 'low' },
  { id: 'cheap', label: 'Under $40', test: (p) => p.price < 40 },
  { id: 'easy', label: 'Easy care', test: (p) => p.care === 'easy' },
]

export const traits = (p: Plant) =>
  [p.petSafe && 'Pet-safe', p.light === 'low' ? 'Low light' : p.light === 'bright' ? 'Bright' : 'Medium', p.care === 'easy' && 'Easy']
    .filter(Boolean)
    .join(' · ')
