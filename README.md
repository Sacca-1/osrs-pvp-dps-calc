# osrs-pvp-dps-calc

[![GitHub contributors](https://img.shields.io/github/contributors/Sacca-1/osrs-pvp-dps-calc)](https://github.com/Sacca-1/osrs-pvp-dps-calc/graphs/contributors)

A PvP-focused damage-per-second calculator for Old School RuneScape.

This project is a fork of the [OSRS Wiki DPS calculator](https://github.com/weirdgloop/osrs-dps-calc). The original calculator was created for the [OSRS Wiki](https://oldschool.runescape.wiki) and focuses on calculating loadout performance against monsters. This fork keeps the OSRS Wiki calculator foundation and adapts the interface and calculations around player-versus-player loadout comparisons.

## What changed in this fork

- Shows PvP attacker and defender loadouts by default.
- Removes the PvM/PvP mode switcher.
- Adds PvP result panels, KO chance metrics, and special attack hit distribution support.
- Adapts PvP-specific mechanics such as protection prayer damage reduction, diamond bolt proc chance, blowpipe attack speed, and Voidwaker special damage.
- Updates branding, footer links, feedback contact, changelog, and privacy policy for this fork.

## Development

```bash
yarn install
yarn dev
```

Useful checks:

```bash
yarn tsc --noEmit
yarn test --runInBand
```

## Acknowledgements

- The [OSRS Wiki DPS calculator](https://github.com/weirdgloop/osrs-dps-calc), which this project is forked from.
- [Weird Gloop](https://weirdgloop.org), the OSRS Wiki team, and the original calculator contributors.
- Bitterkoekje's [spreadsheet](https://docs.google.com/spreadsheets/d/1wzy1VxNWEAAc0FQyDAdpiFggAfn5U6RGPp2CisAHZW8/edit?pli=1#gid=158500257) for initial math and formulas used by the original calculator.
- OSRS Wiki contributors for item, monster, spell, and game-mechanics data.
