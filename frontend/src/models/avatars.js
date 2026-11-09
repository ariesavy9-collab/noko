const backgrounds = ['d7b5f5', 'ffdfb5', 'fbc2d3', 'c5e1a5', 'b2dfdb', 'ffe082', 'e1bee7', 'f8bbd0'];

export const avatarOptions = backgrounds.map((background, index) => ({
  id: `avatar-${index + 1}`,
  src: `https://api.dicebear.com/9.x/avataaars/svg?seed=NokoMashaba${index + 1}&backgroundColor=${background}`
}));

export function avatarUrl(avatarId) {
  return avatarOptions.find((option) => option.id === avatarId)?.src || avatarOptions[0].src;
}
