const SCENES = [
  "On a narrow, wind-whipped bridge high above a churning abyss, two silhouettes danced a deadly ballet of flashing steel and desperate parries under a bruised, stormy sky.",
  `In the quiet clearing behind the old barn, two figures stand a few paces apart, eyeing each other warily as the afternoon sun dips low.`,
  `Beneath the crackling energy of the arcane storm overhead, two figures blurred in a whirlwind of teleporting strikes and exploding elemental magic across the shattered flagstones of the ruined plaza, each desperate thrust and parry echoing with the raw power of their final, desperate gamble.`,
];

export const generateGameScene = async () =>
  SCENES[Math.floor(Math.random() * SCENES.length)];
