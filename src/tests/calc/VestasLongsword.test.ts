import { describe, expect, test } from "@jest/globals";
import PlayerVsNPCCalc from "@/lib/PlayerVsNPCCalc";
import { FeatureStatus } from "@/utils";
import {
  findEquipment,
  getTestMonster,
  getTestPlayer,
} from "@/tests/utils/TestUtils";

const m = getTestMonster("Abyssal demon", "", {
  skills: {
    def: 99,
  },
  defensive: {
    stab: 100,
    slash: 300,
  },
});

describe("Vesta's longsword special attack (Feint)", () => {
  test("should be supported and cost 25% special attack energy", () => {
    const p = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment("Vesta's longsword (bh)"),
      },
    });

    const calc = new PlayerVsNPCCalc(p, m);

    expect(calc.isSpecSupported()).toBe(FeatureStatus.IMPLEMENTED);
    expect(calc.getSpecCost()).toBe(25);
  });

  test("should roll against 25% of stab defence", () => {
    const p = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment("Vesta's longsword (bh)"),
      },
    });

    const normalDefenceRoll = new PlayerVsNPCCalc(p, m, {
      disableMonsterScaling: true,
    }).getNPCDefenceRoll();
    const specDefenceRoll = new PlayerVsNPCCalc(p, m, {
      disableMonsterScaling: true,
      usingSpecialAttack: true,
    }).getNPCDefenceRoll();

    expect(normalDefenceRoll).toBe((99 + 9) * (300 + 64));
    expect(specDefenceRoll).toBe(Math.trunc(((99 + 9) * (100 + 64)) / 4));
  });

  test("should deal 20% to 120% of the standard max hit on successful hits", () => {
    const p = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment("Vesta's longsword (bh)"),
      },
    });

    const normalMax = new PlayerVsNPCCalc(p, m, {
      disableMonsterScaling: true,
    }).getMax();
    const specCalc = new PlayerVsNPCCalc(p, m, {
      disableMonsterScaling: true,
      usingSpecialAttack: true,
      overrides: {
        accuracy: 1,
      },
    });
    const accurateHits = specCalc
      .getDistribution()
      .singleHitsplat.hits
      .filter((hit) => hit.anyAccurate())
      .map((hit) => hit.getSum());

    expect(Math.min(...accurateHits)).toBe(Math.trunc(normalMax / 5));
    expect(Math.max(...accurateHits)).toBe(Math.trunc((normalMax * 6) / 5));
  });
});
