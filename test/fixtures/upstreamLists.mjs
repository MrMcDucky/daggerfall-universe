// The account service's role and title lists as upstream DFO Online shipped them. The fork's
// server-account/wrangler.toml leaves them empty; the grant tests use these names as fixtures.
export const UPSTREAM_LISTS = Object.freeze({
  DEVELOPER_HANDLES: 'Lattymoy,LostMyLeg,Tabby,RookieG,Roderic,SirMcMobdon,kpblca_1',
  OWNER_HANDLES: 'Lattymoy,SirMcMobdon',
  APPROVER_HANDLES: 'Lattymoy',
  REPORT_READER_HANDLES: 'Lattymoy',
  MODERATOR_HANDLES: 'Asynian,tabbyvish,Starempire42',
  CLAUDE_ORDER_HANDLES: 'SirMcMobdon,kpblca_1,Lattymoy',
  HOURS_FIRST_HANDLES: 'aether,ArtemisGodfrey,CycleD0se,Duck,Kobakk,MackyWackyDeeJew,mayaamano,Nirnroot,ofrizz,rosalina,ShikiX3,Temegast,Terra',
  EG_FIRST_HANDLES: 'Serveride',
  FIRST_WYRM_RIDER_HANDLES: 'Seanobi',
  DUNGEON_MASTER_HANDLES: 'SquidKamer',
  DISCIPLE_HANDLES: 'Dutchess,Satranath,Skibbster,Flylighter,valenvalarys',
  SHADOW_FANG_HANDLES: 'SirMcMobdon',
  PENITENT_HANDLES: 'Diggleborf',
  AEGIS_HANDLES: 'Sureme',
  PRIMARCH_HANDLES: 'GA00250',
  CRYSTAL_FIST_HANDLES: 'Flylighter',
  WIKIMAID_HANDLES: 'SylviaBun',
  NIRNROOT_SAGE_HANDLES: 'Blob-Marley',
  COLDHARBOUR_HANDLES: 'trakel',
  PATREON_TIERS: '29666211:disciple,29666234:herald,29666221:hierophant',
});

/** The config text with each empty list filled from UPSTREAM_LISTS, for tests that read the config. @param {string} toml */
export function withFixtureLists(toml) {
  return toml.replace(/^([A-Z_]+) = ""$/gm, (line, k) => (k in UPSTREAM_LISTS ? `${k} = "${UPSTREAM_LISTS[k]}"` : line));
}
