import { describe, expect, test } from "@jest/globals";
import PlayerVsNPCCalc from "@/lib/PlayerVsNPCCalc";
import UserIssueType from "@/enums/UserIssueType";
import {
  findEquipment,
  getTestMonster,
  getTestPlayer,
} from "@/tests/utils/TestUtils";

const m = getTestMonster();

describe("Crimson bludgeon", () => {
  test("should be selectable in test fixtures", () => {
    expect(findEquipment("Crimson bludgeon")).toBeDefined();
  });

  test("should show a pre-release warning when equipped", () => {
    const p = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment("Crimson bludgeon"),
      },
    });

    const calc = new PlayerVsNPCCalc(p, m);

    expect(
      calc.userIssues.some((issue) => issue.type === UserIssueType.WEAPON_PRERELEASE)
    ).toBe(true);
  });

  test("should use four-roll overall accuracy for the special attack", () => {
    const p = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment("Crimson bludgeon"),
      },
    });

    const calc = new PlayerVsNPCCalc(p, m, {
      usingSpecialAttack: true,
      overrides: {
        accuracy: 0.5,
      },
    });

    expect(calc.getHitChance()).toBeCloseTo(1 - 0.5 ** 4);
  });

  test("should use the 130-170% damage band with a -1 max cap when all four rolls succeed", () => {
    const p = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment("Crimson bludgeon"),
      },
    });

    const normalMax = new PlayerVsNPCCalc(p, m).getMax();
    const specCalc = new PlayerVsNPCCalc(p, m, {
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

    expect(specCalc.getMax()).toBe(Math.trunc((normalMax * 170) / 100) - 1);
    expect(Math.min(...accurateHits)).toBe(Math.trunc((normalMax * 130) / 100));
  });

  test("should combine the success-count damage bands using the four roll distribution", () => {
    const p = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment("Crimson bludgeon"),
      },
    });

    const normalMax = new PlayerVsNPCCalc(p, m).getMax();
    const specCalc = new PlayerVsNPCCalc(p, m, {
      usingSpecialAttack: true,
      overrides: {
        accuracy: 0.5,
      },
    });

    const expectedAverageDamage =
      0.25 * ((Math.trunc((normalMax * 70) / 100) + Math.trunc((normalMax * 110) / 100)) / 2) +
      0.375 * ((Math.trunc((normalMax * 90) / 100) + Math.trunc((normalMax * 130) / 100)) / 2) +
      0.25 * ((Math.trunc((normalMax * 110) / 100) + Math.trunc((normalMax * 150) / 100)) / 2) +
      0.0625 * ((Math.trunc((normalMax * 130) / 100) + (Math.trunc((normalMax * 170) / 100) - 1)) / 2);

    expect(specCalc.getDistribution().getExpectedDamage()).toBeCloseTo(
      expectedAverageDamage,
      8
    );
  });
});
