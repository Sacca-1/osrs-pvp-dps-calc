import { describe, expect, test } from "@jest/globals";
import { Prayer } from "@/enums/Prayer";
import PlayerVsNPCCalc from "@/lib/PlayerVsNPCCalc";
import PlayerVsPlayerCalc from "@/lib/PlayerVsPlayerCalc";
import { FeatureStatus } from "@/utils";
import {
  findEquipment,
  getTestMonster,
  getTestPlayer,
} from "@/tests/utils/TestUtils";

const m = getTestMonster();

describe("Voidwaker special attack (Disrupt)", () => {
  test("should support the corrupted voidwaker variant", () => {
    const p = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment("Corrupted voidwaker"),
      },
    });

    const calc = new PlayerVsNPCCalc(p, m);

    expect(calc.isSpecSupported()).toBe(FeatureStatus.IMPLEMENTED);
    expect(calc.getSpecCost()).toBe(50);
    expect(calc.getSpecCalc()).not.toBeNull();
  });

  test("should use guaranteed 50% to 150% melee max damage for corrupted voidwaker", () => {
    const p = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment("Corrupted voidwaker"),
      },
    });

    const normalMax = new PlayerVsNPCCalc(p, m).getMax();
    const specCalc = new PlayerVsNPCCalc(p, m, {
      usingSpecialAttack: true,
    });
    const accurateHits = specCalc
      .getDistribution()
      .singleHitsplat.hits
      .filter((hit) => hit.anyAccurate())
      .map((hit) => hit.getSum());

    expect(specCalc.getHitChance()).toBe(1);
    expect(Math.min(...accurateHits)).toBe(Math.trunc(normalMax / 2));
    expect(Math.max(...accurateHits)).toBe(
      normalMax + Math.trunc(normalMax / 2)
    );
  });

  test("should reduce voidwaker special damage with Protect from Magic in PvP", () => {
    const attacker = getTestPlayer(m, {
      equipment: {
        weapon: findEquipment("Corrupted voidwaker"),
      },
    });
    const defender = getTestPlayer(m);

    const unprotectedMax = new PlayerVsPlayerCalc(attacker, defender, {
      mode: "pvp",
      usingSpecialAttack: true,
    }).getDistribution().getMax();
    const protectedMax = new PlayerVsPlayerCalc(
      attacker,
      {
        ...defender,
        overheadPrayer: Prayer.PROTECT_MAGIC,
      },
      {
        mode: "pvp",
        usingSpecialAttack: true,
      }
    )
      .getDistribution()
      .getMax();

    expect(protectedMax).toBe(Math.trunc((unprotectedMax * 60) / 100));
  });
});
