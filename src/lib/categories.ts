export type CategoryGroup = {
  title: string;
  items: string[];
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    title: 'Headwear',
    items: [
      'Baseball Cap',
      'Snapback',
      'Fitted Cap',
      'Toque',
      'Beanie',
      'Visor',
      'Bucket Hat',
      'Headband',
      'Balaclava',
    ],
  },
  {
    title: 'Tops',
    items: [
      'Jersey',
      'T-Shirt',
      'Long Sleeve',
      'Hoodie',
      'Crewneck',
      'Polo',
      'Tank Top',
      'Compression Shirt',
      'Pinnie',
    ],
  },
  {
    title: 'Outerwear',
    items: ['Jacket', 'Windbreaker', 'Vest', 'Rain Jacket', 'Parka'],
  },
  {
    title: 'Bottoms',
    items: ['Shorts', 'Pants', 'Joggers', 'Leggings', 'Compression Shorts'],
  },
  {
    title: 'Footwear',
    items: ['Cleats', 'Runners', 'Trainers', 'Slides', 'Skates'],
  },
  {
    title: 'Accessories',
    items: [
      'Gloves',
      'Socks',
      'Scarf',
      'Neck Gaiter',
      'Bag',
      'Backpack',
      'Wristband',
      'Belt',
    ],
  },
  {
    title: 'Gear',
    items: ['Helmet', 'Pads', 'Shin Guards', 'Stick', 'Puck', 'Ball'],
  },
];

export const KNOWN_CATEGORIES = new Set(CATEGORY_GROUPS.flatMap((group) => group.items));

export const SPORTS = [
  'Hockey',
  'Baseball',
  'Basketball',
  'Football',
  'Soccer',
  'Golf',
  'Running',
  'Training',
  'Lacrosse',
  'Tennis',
  'Volleyball',
  'General',
];

export const SIZES = [
  'YXS',
  'YS',
  'YM',
  'YL',
  'YXL',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  'OSFA',
];

export const COLORS = [
  'Black',
  'White',
  'Navy',
  'Royal',
  'Red',
  'Green',
  'Grey',
  'Gold',
  'Orange',
  'Purple',
  'Pink',
  'Camo',
  'Multi',
];
