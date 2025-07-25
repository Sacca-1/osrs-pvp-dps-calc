// noinspection FallThroughInSwitchStatementJS

import {
  autorun,
  IReactionDisposer,
  IReactionPublic,
  makeAutoObservable,
  reaction,
  toJS,
} from "mobx";
import React, { createContext, useContext } from "react";
import { PartialDeep } from "type-fest";
import * as localforage from "localforage";
import {
  CalculatedLoadout,
  Calculator,
  IMPORT_VERSION,
  ImportableData,
  PlayerVsNPCCalculatedLoadout,
  Preferences,
  State,
  UI,
  UserIssue,
} from "@/types/State";
import merge from "lodash.mergewith";
import {
  EquipmentPiece,
  Player,
  PlayerEquipment,
  PlayerSkills,
} from "@/types/Player";
import { Monster } from "@/types/Monster";
import { MonsterAttribute } from "@/enums/MonsterAttribute";
import { toast } from "react-toastify";
import {
  fetchPlayerSkills,
  fetchShortlinkData,
  getCombatStylesForCategory,
  isDefined,
  PotionMap,
} from "@/utils";
import {
  ComputeBasicRequest,
  ComputeReverseRequest,
  WorkerRequestType,
} from "@/worker/CalcWorkerTypes";
import { getMonsters, INITIAL_MONSTER_INPUTS } from "@/lib/Monsters";
import {
  availableEquipment,
  calculateEquipmentBonusesFromGear,
} from "@/lib/Equipment";
import { CalcWorker } from "@/worker/CalcWorker";
import { spellByName } from "@/types/Spell";
import { DEFAULT_ATTACK_SPEED, NUMBER_OF_LOADOUTS } from "@/lib/constants";
import { EquipmentCategory } from "./enums/EquipmentCategory";
import {
  ARM_PRAYERS,
  BRAIN_PRAYERS,
  DEFENSIVE_PRAYERS,
  OFFENSIVE_PRAYERS,
  OVERHEAD_PRAYERS,
  Prayer,
} from "./enums/Prayer";
import Potion from "./enums/Potion";
import { startPollingForRuneLite, WikiSyncer } from "./wikisync/WikiSyncer";
import { sum, max } from "d3-array";
import PlayerVsPlayerCalc from "@/lib/PlayerVsPlayerCalc";

const EMPTY_CALC_LOADOUT = {} as CalculatedLoadout;

const generateInitialEquipment = () => {
  const initialEquipment: PlayerEquipment = {
    ammo: null,
    body: null,
    cape: null,
    feet: null,
    hands: null,
    head: null,
    legs: null,
    neck: null,
    ring: null,
    shield: null,
    weapon: null,
  };
  return initialEquipment;
};

export const generateEmptyPlayer = (name?: string): Player => ({
  name: name ?? "Loadout 1",
  style: getCombatStylesForCategory(EquipmentCategory.NONE)[0],
  skills: {
    atk: 99,
    def: 99,
    hp: 99,
    magic: 99,
    prayer: 99,
    ranged: 99,
    str: 99,
    mining: 99,
    herblore: 99,
  },
  boosts: {
    atk: 0,
    def: 0,
    hp: 0,
    magic: 0,
    prayer: 0,
    ranged: 0,
    str: 0,
    mining: 0,
    herblore: 0,
  },
  equipment: generateInitialEquipment(),
  overheadPrayer: null,
  attackSpeed: DEFAULT_ATTACK_SPEED,
  prayers: [],
  bonuses: {
    str: 0,
    ranged_str: 0,
    magic_str: 0,
    prayer: 0,
  },
  defensive: {
    stab: 0,
    slash: 0,
    crush: 0,
    magic: 0,
    ranged: 0,
  },
  offensive: {
    stab: 0,
    slash: 0,
    crush: 0,
    magic: 0,
    ranged: 0,
  },
  buffs: {
    potions: [],
    onSlayerTask: true,
    inWilderness: false,
    kandarinDiary: true,
    chargeSpell: false,
    markOfDarknessSpell: false,
    forinthrySurge: false,
    soulreaperStacks: 0,
    baAttackerLevel: 0,
    chinchompaDistance: 4, // 4 tiles is the optimal range for "medium fuse" (rapid), which is the default selected stance
    usingSunfireRunes: false,
    frozen: true,
    antifire: false,
    atlatlBurnStacks: 0,
    conflictionGauntletsPreviousMagicAttack: "average",
  },
  spell: null,
});

export const parseLoadoutsFromImportedData = (data: ImportableData) =>
  data.loadouts.map((loadout, i) => {
    // For each item, reload the most current data using the item ID to ensure we're not using stale data.
    if (loadout.equipment) {
      for (const [k, v] of Object.entries(loadout.equipment)) {
        if (v === null) continue;
        let item: EquipmentPiece | undefined;
        if (Object.hasOwn(v, "id")) {
          item = availableEquipment.find((eq) => eq.id === v.id);
          if (item) {
            // include the hidden itemVars inputs that are not present on the availableEquipment store
            if (Object.hasOwn(v, "itemVars")) {
              item = { ...item, itemVars: v.itemVars };
            }
          } else {
            console.warn(
              `[parseLoadoutsFromImportedData] No item found for item ID ${v.id}`
            );
          }
        }
        // The following line will remove the item entirely if it seems to no longer exist.
        loadout.equipment[k as keyof typeof loadout.equipment] = item || null;
      }
    }

    // load the current spell, if applicable
    if (loadout.spell?.name) {
      loadout.spell = spellByName(loadout.spell.name);
    }

    return { name: `Loadout ${i + 1}`, ...loadout };
  });

class GlobalState implements State {
  serializationVersion = IMPORT_VERSION;

  monster: Monster = {
    id: 415,
    name: "Abyssal demon",
    version: "Standard",
    image: "Abyssal demon.png",
    size: 1,
    speed: 4,
    style: "stab",
    skills: {
      atk: 97,
      def: 135,
      hp: 150,
      magic: 1,
      ranged: 1,
      str: 67,
    },
    offensive: {
      atk: 0,
      magic: 0,
      magic_str: 0,
      ranged: 0,
      ranged_str: 0,
      str: 0,
    },
    defensive: {
      flat_armour: 0,
      stab: 20,
      slash: 20,
      crush: 20,
      magic: 0,
      light: 20,
      standard: 20,
      heavy: 20,
    },
    attributes: [MonsterAttribute.DEMON],
    weakness: null,
    immunities: {
      burn: null,
    },
    inputs: { ...INITIAL_MONSTER_INPUTS },
  };

  attackerLoadouts: Player[] = [generateEmptyPlayer("Attacker 1")];

  defenderLoadouts: Player[] = [generateEmptyPlayer("Defender 1")];

  // Attacker tab index
  selectedAttacker = 0;

  // Defender tab index
  selectedDefender = 0;

  ui: UI = {
    showPreferencesModal: false,
    showShareModal: false,
    username: "",
    isDefensiveReductionsExpanded: false,
  };

  prefs: Preferences = {
    manualMode: false,
    rememberUsername: true,
    showHitDistribution: false,
    showLoadoutComparison: false,
    showTtkComparison: false,
    showNPCVersusPlayerResults: false,
    hitDistsHideZeros: false,
    hitDistShowSpec: false,
    resultsExpanded: false,
    calcMode: "pvp",
  };

  calc: Calculator = {
    loadouts: [
      {
        npcDefRoll: 0,
        maxHit: 0,
        maxAttackRoll: 0,
        npcMaxHit: 0,
        npcMaxAttackRoll: 0,
        npcDps: 0,
        npcAccuracy: 0,
        playerDefRoll: 0,
        accuracy: 0,
        dps: 0,
        ttk: 0,
        hitDist: [],
        ttkDist: undefined,
      },
    ],
  };

  private calcWorker!: CalcWorker;

  availableMonsters = getMonsters();

  private _debug: boolean = false;

  /**
   * Map of WikiSync instances (PORT -> WIKISYNCER) that we attempt to persistently connect to.
   * The WikiSync RuneLite plugin includes a websocket server which exposes player information from the local
   * RuneLite client to the DPS calculator.
   */
  wikisync: Map<number, WikiSyncer> = new Map();

  private storageUpdater?: IReactionDisposer;

  /**
   * Which side (attacker or defender) should be affected by user interactions coming from the UI.
   * Set by Player/Defender containers on mouse-enter so that all child components automatically
   * act on the correct loadout without needing to thread a `side` prop through every component.
   */
  activeSide: "attacker" | "defender" = "attacker";

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });

    const recomputeBoosts = () => {
      // Re-compute the player's boost values.
      const boosts: Partial<PlayerSkills> = {
        atk: 0,
        def: 0,
        magic: 0,
        prayer: 0,
        ranged: 0,
        str: 0,
        mining: 0,
        herblore: 0,
      };

      for (const p of this.player.buffs.potions) {
        const result = PotionMap[p].calculateFn(this.player.skills);
        for (const k of Object.keys(result)) {
          const r = result[k as keyof typeof result] as number;
          if (r > boosts[k as keyof typeof boosts]!) {
            // If this skill's boost is higher than what it already is, then change it
            boosts[k as keyof typeof boosts] = result[
              k as keyof typeof result
            ] as number;
          }
        }
      }

      this.updatePlayer({ boosts });
    };

    const potionTriggers: ((r: IReactionPublic) => unknown)[] = [
      () => toJS(this.player.skills),
      () => toJS(this.player.buffs.potions),
    ];
    potionTriggers.map((t) =>
      reaction(t, recomputeBoosts, { fireImmediately: false })
    );

    // for toa monster + shadow handling
    const equipmentTriggers: ((r: IReactionPublic) => unknown)[] = [
      () => toJS(this.monster),
    ];
    equipmentTriggers.map((t) =>
      reaction(t, () => {
        if (!this.prefs.manualMode) {
          this.recalculateEquipmentBonusesFromGearAll();
        }
      })
    );

    if ((process.env.NEXT_PUBLIC_DISABLE_WS || "false") !== "true") {
      this.wikisync = startPollingForRuneLite();
    }
  }

  set debug(debug: boolean) {
    this._debug = debug;
  }

  get debug(): boolean {
    return this._debug;
  }

  /**
   * Get the importable version of the current UI state
   */
  get asImportableData(): ImportableData {
    return {
      serializationVersion: IMPORT_VERSION,
      loadouts: toJS(this.attackerLoadouts),
      selectedLoadout: this.selectedAttacker,

      // NEW – defender side persistence
      defenderLoadouts: toJS(this.defenderLoadouts),
      selectedDefender: this.selectedDefender,

      monster: toJS(this.monster),
    };
  }

  /**
   * Get the currently selected player (loadout)
   */
  get player() {
    return this.attackerLoadouts[this.selectedAttacker];
  }

  get defender() {
    return this.defenderLoadouts[this.selectedDefender];
  }

  /**
   * Returns the data for the currently equipped items
   */
  get equipmentData() {
    return this.player.equipment;
  }

  /**
   * Get the user's current issues based on their calculated loadouts
   */
  get userIssues() {
    let is: UserIssue[] = [];

    // Determine the current global/UI-related issues
    // ex. is.push({ type: UserIssueType.MONSTER_UNIQUE_EFFECTS, message: 'This monster has unique effects that are not yet accounted for. Results may be inaccurate.' });
    // Add in the issues returned from the calculator
    for (const l of Object.values(this.calc.loadouts)) {
      if (l.userIssues) is = [...is, ...l.userIssues];
    }
    return is;
  }

  /**
   * Get the available combat styles for the currently equipped weapon
   * @see https://oldschool.runescape.wiki/w/Combat_Options
   */
  get availableCombatStyles() {
    const cat =
      this.player.equipment.weapon?.category || EquipmentCategory.NONE;
    return getCombatStylesForCategory(cat);
  }

  /**
   * Whether the currently selected monster has non-standard mechanics or behaviour.
   * In this case, we should hide UI elements relating to reverse DPS/damage taken metrics.
   */
  get isNonStandardMonster() {
    return !["slash", "crush", "stab", "magic", "ranged"].includes(
      this.monster.style || ""
    );
  }

  /**
   * Returns the WikiSyncer instances that have user information attached (AKA the user is logged in),
   * rather than all of the instances that have an attempted connection.
   */
  get validWikiSyncInstances() {
    return new Map([...this.wikisync].filter(([, v]) => v.username));
  }

  /**
   * Initialises the autorun function for updating dps-calc-state when something changes.
   * This should only ever be called once.
   */
  startStorageUpdater() {
    if (this.storageUpdater) {
      console.warn("[GlobalState] StorageUpdater is already set!");
      return;
    }
    this.storageUpdater = autorun(() => {
      // Save their application state to browser storage
      localforage
        .setItem("dps-calc-state", toJS(this.asImportableData))
        .catch(() => {});
    });
  }

  setCalcWorker(worker: CalcWorker) {
    if (this.calcWorker) {
      console.warn("[GlobalState] CalcWorker is already set!");
      this.calcWorker.shutdown();
    }
    worker.initWorker();
    this.calcWorker = worker;
  }

  updateEquipmentBonuses(
    loadoutIx?: number,
    side: "attacker" | "defender" = this.activeSide
  ) {
    const list =
      side === "attacker" ? this.attackerLoadouts : this.defenderLoadouts;
    loadoutIx =
      loadoutIx !== undefined
        ? loadoutIx
        : side === "attacker"
        ? this.selectedAttacker
        : this.selectedDefender;

    list[loadoutIx] = merge(
      list[loadoutIx],
      calculateEquipmentBonusesFromGear(list[loadoutIx], this.monster)
    );
  }

  recalculateEquipmentBonusesFromGearAll() {
    // Recalculate for both attacker and defender loadouts
    this.attackerLoadouts.forEach((_, i) =>
      this.updateEquipmentBonuses(i, "attacker")
    );
    this.defenderLoadouts.forEach((_, i) =>
      this.updateEquipmentBonuses(i, "defender")
    );
  }

  updateUIState(ui: PartialDeep<UI>) {
    this.ui = Object.assign(this.ui, ui);
  }

  updateCalcResults(calc: PartialDeep<Calculator>) {
    this.calc = merge(this.calc, calc);
  }

  updateCalcTtkDist(
    loadoutIx: number,
    ttkDist: PlayerVsNPCCalculatedLoadout["ttkDist"]
  ) {
    this.calc.loadouts[loadoutIx].ttkDist = ttkDist;
  }

  async loadShortlink(linkId: string) {
    let data: ImportableData;

    await toast.promise(
      async () => {
        data = await fetchShortlinkData(linkId);

        /**
         * For future reference: if we ever change the schema of the loadouts or the monster object,
         * then some of the JSON data we store for shortlinks will be incorrect. We can handle those instances here, as
         * a sort of "on-demand migration".
         *
         * Also: the reason we're merging the objects below is that we're trying our hardest not to cause the app to
         * error if the JSON data is bad. To achieve that, we do a deep merge of the loadouts and monster objects so that
         * the existing data still remains.
         */

        this.updateImportedData(data);
      },
      {
        pending: "Loading data from shared link...",
        success: "Loaded data from shared link!",
        error: "Failed to load shared link data. Please try again.",
      },
      {
        toastId: "shortlink",
      }
    );
  }

  updateImportedData(data: ImportableData) {
    /* eslint-disable no-fallthrough */
    switch (data.serializationVersion) {
      case 1:
        data.monster.inputs.phase = data.monster.inputs.tormentedDemonPhase;

      case 2: // reserved: used during leagues 5
      case 3: // reserved: used during leagues 5
      case 4: // reserved: used during leagues 5
      case 5:
        data.loadouts.forEach((l) => {
          /* eslint-disable @typescript-eslint/dot-notation */
          /* eslint-disable @typescript-eslint/no-explicit-any */
          if ((l as any)["leagues"]) {
            delete (l as any)["leagues"];
          }
          /* eslint-enable @typescript-eslint/dot-notation */
          /* eslint-enable @typescript-eslint/no-explicit-any */
        });

      case 6:
        // partyAvgMiningLevel becomes partySumMiningLevel
        if (isDefined(data.monster.inputs.partyAvgMiningLevel)) {
          data.monster.inputs.partySumMiningLevel =
            data.monster.inputs.partyAvgMiningLevel *
            data.monster.inputs.partySize;
          delete data.monster.inputs.partyAvgMiningLevel;
        }

      case 7:
        if (!isDefined(data.monster.immunities)) {
          data.monster.immunities = {
            burn: null,
          };
        }

      case 8: // reserved for future use
      case 9:
        // Add default confliction gauntlets setting for existing loadouts
        data.loadouts.forEach((l) => {
          if (
            l.buffs &&
            !isDefined(l.buffs.conflictionGauntletsPreviousMagicAttack)
          ) {
            l.buffs.conflictionGauntletsPreviousMagicAttack = "average";
          }
        });
        // Also handle defender loadouts if they exist
        if (data.defenderLoadouts) {
          data.defenderLoadouts.forEach((l) => {
            if (
              l.buffs &&
              !isDefined(l.buffs.conflictionGauntletsPreviousMagicAttack)
            ) {
              l.buffs.conflictionGauntletsPreviousMagicAttack = "average";
            }
          });
        }

      default:
    }
    /* eslint-enable no-fallthrough */
    console.debug("IMPORT | ", data);

    if (data.monster) {
      let newMonster: PartialDeep<Monster> = {};

      if (data.monster.id > -1) {
        const monstersById = getMonsters().filter(
          (m) => m.id === data.monster.id
        );
        if ((monstersById?.length || 0) === 0) {
          throw new Error(
            `Failed to find monster by id '${data.monster.id}' from shortlink`
          );
        }

        if (monstersById.length === 1) {
          newMonster = monstersById[0];
        } else {
          const version = monstersById.find(
            (m) => m.version === data.monster.version
          );
          if (version) {
            newMonster = version;
          } else {
            newMonster = monstersById[0];
          }
        }
      } else {
        newMonster = data.monster;
      }

      // If the passed monster def reductions are different to the defaults, expand the UI section.
      for (const [k, v] of Object.entries(
        data.monster.inputs?.defenceReductions
      )) {
        if (
          v !== undefined &&
          v !==
            INITIAL_MONSTER_INPUTS.defenceReductions[
              k as keyof typeof INITIAL_MONSTER_INPUTS.defenceReductions
            ]
        ) {
          this.updateUIState({ isDefensiveReductionsExpanded: true });
          break;
        }
      }

      // only use the shortlink for user-input fields, trust cdn for others in case they change
      this.updateMonster({
        ...newMonster,
        inputs: data.monster.inputs,
      });
    }

    // Expand some minified fields with their full metadata
    const loadouts = parseLoadoutsFromImportedData(data);

    // manually recompute equipment in case their metadata has changed since the shortlink was created
    loadouts.forEach((p, ix) => {
      if (this.attackerLoadouts[ix] === undefined)
        this.attackerLoadouts.push(generateEmptyPlayer());
      this.updatePlayer(p, ix);
    });
    this.recalculateEquipmentBonusesFromGearAll();

    this.selectedAttacker = data.selectedLoadout || 0;

    // Handle defender loadouts if present (backwards-compatible)
    if (data.defenderLoadouts && data.defenderLoadouts.length > 0) {
      const defLoadouts = data.defenderLoadouts.map((l, i) => ({
        ...l,
        name: `Defender ${i + 1}`,
      })) as typeof data.loadouts;
      // Expand metadata same as attacker path
      defLoadouts.forEach((loadout) => {
        if (loadout.equipment) {
          for (const [slot, v] of Object.entries(loadout.equipment)) {
            if (v === null) continue;
            let item;
            if (Object.hasOwn(v, "id")) {
              item = availableEquipment.find((eq) => eq.id === (v as any).id);
              if (item && Object.hasOwn(v, "itemVars")) {
                item = { ...item, itemVars: (v as any).itemVars } as any;
              }
            }
            (loadout.equipment as any)[slot] = item || null;
          }
        }
      });

      defLoadouts.forEach((p, ix) => {
        if (this.defenderLoadouts[ix] === undefined)
          this.defenderLoadouts.push(generateEmptyPlayer());
        this.updatePlayer(p, ix, "defender");
      });

      this.selectedDefender = data.selectedDefender || 0;
    }
  }

  loadPreferences() {
    localforage
      .getItem("dps-calc-prefs")
      .then((v) => {
        this.updatePreferences(v as PartialDeep<Preferences>);
      })
      .catch((e) => {
        console.error(e);
        // TODO maybe some handling here
      });
  }

  async fetchCurrentPlayerSkills(
    usernameOverride?: string,
    side: "attacker" | "defender" = this.activeSide
  ) {
    const username = usernameOverride ?? this.ui.username;

    try {
      const res = await toast.promise(
        fetchPlayerSkills(username),
        {
          pending: "Fetching player skills...",
          success: `Successfully fetched player skills for ${username}!`,
          error: "Error fetching player skills",
        },
        {
          toastId: "skills-fetch",
        }
      );

      if (res) this.updatePlayer({ skills: res }, undefined, side);
    } catch (e) {
      console.error(e);
    }
  }

  updatePreferences(pref: PartialDeep<Preferences>) {
    // Update local state store
    this.prefs = Object.assign(this.prefs, pref);

    if (pref && Object.prototype.hasOwnProperty.call(pref, "manualMode")) {
      // Reset player bonuses to their worn equipment
      this.recalculateEquipmentBonusesFromGearAll();
    }

    // Save to browser storage
    localforage.setItem("dps-calc-prefs", toJS(this.prefs)).catch((e) => {
      console.error(e);
      // TODO something that isn't this
      // eslint-disable-next-line no-alert
      alert(
        "Could not persist preferences to browser. Make sure our site has permission to do this."
      );
    });
  }

  /**
   * Toggle a potion, with logic to remove from or add to the potions array depending on if it is already in there.
   * @param potion
   */
  togglePlayerPotion(
    potion: Potion,
    side: "attacker" | "defender" = this.activeSide
  ) {
    const list =
      side === "attacker" ? this.attackerLoadouts : this.defenderLoadouts;
    const tgt =
      list[side === "attacker" ? this.selectedAttacker : this.selectedDefender];

    const isToggled = tgt.buffs.potions.includes(potion);
    if (isToggled) {
      tgt.buffs.potions = tgt.buffs.potions.filter((p) => p !== potion);
    } else {
      tgt.buffs.potions = [...tgt.buffs.potions, potion];
    }

    // Recompute boosts for this loadout
    const boosts: Partial<PlayerSkills> = {
      atk: 0,
      def: 0,
      magic: 0,
      prayer: 0,
      ranged: 0,
      str: 0,
      mining: 0,
      herblore: 0,
    };
    for (const p of tgt.buffs.potions) {
      const result = PotionMap[p].calculateFn(tgt.skills);
      for (const k of Object.keys(result) as (keyof PlayerSkills)[]) {
        boosts[k] = Math.max(boosts[k] ?? 0, result[k] ?? 0);
      }
    }

    tgt.boosts = { ...tgt.boosts, ...boosts } as PlayerSkills;
  }

  /**
   * Toggle a prayer, with logic to remove from or add to the prayers array depending on if it is already in there.
   * @param prayer
   */
  togglePlayerPrayer(
    prayer: Prayer,
    side: "attacker" | "defender" = this.activeSide
  ) {
    const list =
      side === "attacker" ? this.attackerLoadouts : this.defenderLoadouts;
    const tgt =
      list[side === "attacker" ? this.selectedAttacker : this.selectedDefender];

    const isToggled = tgt.prayers.includes(prayer);
    if (isToggled) {
      // If we're toggling off an existing prayer, just filter it out from the array
      tgt.prayers = tgt.prayers.filter((p) => p !== prayer);
    } else {
      // If we're toggling on a new prayer, let's do some checks to ensure that some prayers cannot be enabled alongside it
      let newPrayers = [...tgt.prayers];

      // If this is a defensive prayer, disable all other defensive prayers
      if (DEFENSIVE_PRAYERS.includes(prayer))
        newPrayers = newPrayers.filter((p) => !DEFENSIVE_PRAYERS.includes(p));

      // If this is an overhead prayer, disable all other overhead prayers
      if (OVERHEAD_PRAYERS.includes(prayer))
        newPrayers = newPrayers.filter((p) => !OVERHEAD_PRAYERS.includes(p));

      // If this is an offensive prayer...
      if (OFFENSIVE_PRAYERS.includes(prayer)) {
        newPrayers = newPrayers.filter((p) => {
          // If this is a "brain" prayer, it can only be paired with arm prayers
          if (BRAIN_PRAYERS.includes(prayer))
            return !OFFENSIVE_PRAYERS.includes(p) || ARM_PRAYERS.includes(p);
          // If this is an "arm" prayer, it can only be paired with brain prayers
          if (ARM_PRAYERS.includes(prayer))
            return !OFFENSIVE_PRAYERS.includes(p) || BRAIN_PRAYERS.includes(p);
          // Otherwise, there are no offensive prayers it can be paired with, disable them all
          return !OFFENSIVE_PRAYERS.includes(p);
        });
      }

      tgt.prayers = [...newPrayers, prayer];
    }

    // Sync the dedicated overheadPrayer field used for PvP damage reduction logic
    const activeOverhead =
      tgt.prayers.find((p) => OVERHEAD_PRAYERS.includes(p)) || null;
    tgt.overheadPrayer = activeOverhead;
  }

  /**
   * Toggle a monster attribute.
   * @param attr
   */
  toggleMonsterAttribute(attr: MonsterAttribute) {
    const isToggled = this.monster.attributes.includes(attr);
    if (isToggled) {
      this.monster.attributes = this.monster.attributes.filter(
        (a) => a !== attr
      );
    } else {
      this.monster.attributes = [...this.monster.attributes, attr];
    }
  }

  /**
   * Update the player state.
   * @param player
   * @param loadoutIx Which loadout to update. Defaults to the current selected loadout.
   */
  updatePlayer(
    player: PartialDeep<Player>,
    loadoutIx?: number,
    side?: "attacker" | "defender"
  ) {
    side = side || this.activeSide;

    const list =
      side === "attacker" ? this.attackerLoadouts : this.defenderLoadouts;

    loadoutIx =
      loadoutIx !== undefined
        ? loadoutIx
        : side === "attacker"
        ? this.selectedAttacker
        : this.selectedDefender;

    const eq = player.equipment;
    if (eq && (Object.hasOwn(eq, "weapon") || Object.hasOwn(eq, "shield"))) {
      const currentWeapon = list[loadoutIx].equipment.weapon;
      const newWeapon =
        player.equipment?.weapon !== undefined
          ? player.equipment.weapon
          : currentWeapon;

      // Reset combat style if weapon category actually changes
      if (player.equipment?.weapon !== undefined) {
        const oldWeaponCat = currentWeapon?.category || EquipmentCategory.NONE;
        const newWeaponCat =
          player.equipment.weapon?.category || EquipmentCategory.NONE;
        if (newWeaponCat !== oldWeaponCat && !player.style) {
          const styles = getCombatStylesForCategory(newWeaponCat);
          player.style =
            styles.find((s) => s.stance === "Aggressive") ??
            styles.find((s) => s.stance === "Rapid") ??
            styles[0];
        }
      }

      // After prospective merge, ensure we don't end up with 2h weapon + shield simultaneously
      const prospective = {
        ...list[loadoutIx].equipment,
        ...player.equipment,
      } as PlayerEquipment;
      if (prospective.weapon?.isTwoHanded && prospective.shield) {
        // Prefer keeping the weapon, drop shield
        prospective.shield = null;
      }

      // write back prospective equipment into patch
      player.equipment = prospective;
    }

    list[loadoutIx] = merge(list[loadoutIx], player);
    if (!this.prefs.manualMode) {
      // Recalculate equipment bonuses for whichever side was updated
      const updatedBonuses = calculateEquipmentBonusesFromGear(
        list[loadoutIx],
        this.monster
      );
      list[loadoutIx] = merge(list[loadoutIx], updatedBonuses);
    }
  }

  /**
   * Update the monster state.
   * @param monster
   */
  updateMonster(monster: PartialDeep<Monster>) {
    // If monster attributes were passed to this function, clear the existing ones
    if (monster.attributes !== undefined) this.monster.attributes = [];

    // If the monster ID was changed, reset all the inputs.
    if (
      monster.id !== undefined &&
      monster.id !== this.monster.id &&
      !Object.hasOwn(monster, "inputs")
    ) {
      monster = {
        ...monster,
        inputs: INITIAL_MONSTER_INPUTS,
      };
    }

    this.monster = merge(this.monster, monster, (obj, src) => {
      // This check is to ensure that empty arrays always override existing arrays, even if they have values.
      if (Array.isArray(src) && src.length === 0) {
        return src;
      }
      return undefined;
    });
  }

  /**
   * Clear an equipment slot, removing the item that was inside of it.
   * @param slot
   */
  clearEquipmentSlot(
    slot: keyof PlayerEquipment,
    side: "attacker" | "defender" = this.activeSide
  ) {
    this.updatePlayer(
      {
        equipment: {
          [slot]: null,
        },
      },
      undefined,
      side
    );
  }

  setSelectedLoadout(ix: number) {
    this.selectedAttacker = ix;
  }

  setSelectedDefender(ix: number) {
    this.selectedDefender = ix;
  }

  deleteLoadout(ix: number, side: "attacker" | "defender" = "attacker") {
    const list =
      side === "attacker" ? this.attackerLoadouts : this.defenderLoadouts;
    if (list.length === 1) {
      list[0] = generateEmptyPlayer();
      return;
    }

    const newList = list.filter((_, i) => i !== ix);
    if (side === "attacker") this.attackerLoadouts = newList;
    else this.defenderLoadouts = newList;

    if (side === "attacker") {
      if (this.selectedAttacker >= ix && ix !== 0) this.selectedAttacker -= 1;
    } else if (this.selectedDefender >= ix && ix !== 0) {
      this.selectedDefender -= 1;
    }
  }

  renameLoadout(
    ix: number,
    name: string,
    side: "attacker" | "defender" = "attacker"
  ) {
    const loadout =
      side === "attacker"
        ? this.attackerLoadouts[ix]
        : this.defenderLoadouts[ix];

    const trimmedName = name.trim();
    if (loadout) {
      if (trimmedName) {
        loadout.name = trimmedName;
      } else {
        loadout.name = `Loadout ${ix + 1}`;
      }
    }

    if (side === "attacker") {
      this.attackerLoadouts[ix] = {
        ...loadout,
        name: trimmedName,
      };
    } else {
      this.defenderLoadouts[ix] = {
        ...loadout,
        name: trimmedName,
      };
    }
  }

  get canCreateLoadout() {
    return this.attackerLoadouts.length < NUMBER_OF_LOADOUTS;
  }

  createLoadout(
    selected?: boolean,
    cloneIndex?: number,
    side: "attacker" | "defender" = "attacker"
  ) {
    const list =
      side === "attacker" ? this.attackerLoadouts : this.defenderLoadouts;
    if (list.length >= NUMBER_OF_LOADOUTS) return;

    const indexToClone = cloneIndex ?? 0;
    const deepClone = JSON.parse(JSON.stringify(list[indexToClone])) as Player;
    list.push({
      ...deepClone,
      name: `${side === "attacker" ? "Attacker" : "Defender"} ${
        list.length + 1
      }`,
    });

    this.recalculateEquipmentBonusesFromGearAll();

    if (selected) {
      if (side === "attacker") this.setSelectedLoadout(list.length - 1);
      else this.selectedDefender = list.length - 1;
    }
  }

  async doWorkerRecompute() {
    if (!this.calcWorker?.isReady()) {
      console.debug(
        "[GlobalState] doWorkerRecompute called but worker is not ready, ignoring for now."
      );
      return;
    }

    // clear existing loadout data
    const calculatedLoadouts: CalculatedLoadout[] = [];
    this.attackerLoadouts.forEach(() =>
      calculatedLoadouts.push(EMPTY_CALC_LOADOUT)
    );
    this.calc.loadouts = calculatedLoadouts;

    const data: Extract<
      ComputeBasicRequest["data"],
      ComputeReverseRequest["data"]
    > = {
      loadouts: toJS(this.attackerLoadouts),
      monster: toJS(this.monster),
      calcOpts: {
        hitDistHideMisses: this.prefs.hitDistsHideZeros,
        detailedOutput: this.debug,
        disableMonsterScaling: this.monster.id === -1,
      },
    };
    const request = async (
      type: WorkerRequestType.COMPUTE_BASIC | WorkerRequestType.COMPUTE_REVERSE
    ) => {
      const resp = await this.calcWorker.do({
        type,
        data,
      });

      console.log(
        `[GlobalState] Calc response ${WorkerRequestType[type]}`,
        resp.payload
      );
      this.updateCalcResults({ loadouts: resp.payload });
    };

    const promises: Promise<void>[] = [];
    promises.push(
      request(WorkerRequestType.COMPUTE_BASIC),
      request(WorkerRequestType.COMPUTE_REVERSE)
    );

    if (this.prefs.showTtkComparison) {
      promises.push(
        (async () => {
          const parallel = process.env.NEXT_PUBLIC_SERIAL_TTK !== "true";
          const resp = await this.calcWorker.do({
            type: parallel
              ? WorkerRequestType.COMPUTE_TTK_PARALLEL
              : WorkerRequestType.COMPUTE_TTK,
            data,
          });

          for (const [ix, loadout] of resp.payload.entries()) {
            this.updateCalcTtkDist(ix, loadout.ttkDist);
          }
        })()
      );
    }

    await Promise.all(promises);
  }

  get pvpCalc() {
    if (
      this.attackerLoadouts.length === 0 ||
      this.defenderLoadouts.length === 0
    )
      return null;
    const attacker = this.attackerLoadouts[this.selectedAttacker];
    const defender = this.defenderLoadouts[this.selectedDefender];
    const calc = new PlayerVsPlayerCalc(attacker, defender, {
      detailedOutput: false,
      mode: "pvp",
    });
    const reverse = new PlayerVsPlayerCalc(defender, attacker, {
      detailedOutput: false,
      mode: "pvp",
    });
    return {
      attackerDps: calc.getDps?.() ?? 0,
      defenderDps: reverse.getDps?.() ?? 0,
      calc,
      reverse,
    };
  }

  get isPvpMode() {
    return this.prefs.calcMode === "pvp";
  }

  get loadouts() {
    // Temporary alias for backward compatibility; maps to attacker loadouts in PvP mode
    return this.attackerLoadouts;
  }

  // Backwards-compatibility alias. Many existing components still reference `selectedLoadout`.
  get selectedLoadout() {
    return this.selectedAttacker;
  }

  setActiveSide(side: "attacker" | "defender") {
    this.activeSide = side;
  }
}

const StoreContext = createContext<GlobalState>(new GlobalState());

const StoreProvider: React.FC<{
  store: GlobalState;
  children: React.ReactNode;
}> = ({ store, children }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
);

const useStore = () => useContext(StoreContext);

export { GlobalState, StoreProvider, useStore };
