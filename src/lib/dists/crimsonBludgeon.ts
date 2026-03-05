import {
  AttackDistribution,
  HitDistribution,
  Hitsplat,
  WeightedHit,
} from "@/lib/HitDist";

const SUCCESS_DAMAGE_BANDS: [minPercent: number, maxPercent: number][] = [
  [70, 110],
  [90, 130],
  [110, 150],
  [130, 170],
];

const binomialCoefficient = (n: number, k: number): number => {
  if (k < 0 || k > n) {
    return 0;
  }

  if (k === 0 || k === n) {
    return 1;
  }

  let result = 1;
  for (let i = 1; i <= k; i += 1) {
    result = (result * (n - (k - i))) / i;
  }
  return result;
};

export const crimsonBludgeonSpec = (
  singleRollAccuracy: number,
  max: number
): AttackDistribution => {
  const dist = new HitDistribution([]);

  for (let successCount = 1; successCount <= 4; successCount += 1) {
    const [minPercent, maxPercent] = SUCCESS_DAMAGE_BANDS[successCount - 1];
    const low = Math.trunc((max * minPercent) / 100);
    const high = Math.max(
      low,
      Math.trunc((max * maxPercent) / 100) - (successCount === 4 ? 1 : 0)
    );
    const probability =
      binomialCoefficient(4, successCount) *
      singleRollAccuracy ** successCount *
      (1 - singleRollAccuracy) ** (4 - successCount);
    const chancePerHit = probability / (high - low + 1);

    for (let damage = low; damage <= high; damage += 1) {
      dist.addHit(new WeightedHit(chancePerHit, [new Hitsplat(damage)]));
    }
  }

  dist.addHit(
    new WeightedHit((1 - singleRollAccuracy) ** 4, [Hitsplat.INACCURATE])
  );

  return new AttackDistribution([dist]);
};
