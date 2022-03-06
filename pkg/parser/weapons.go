package parser

import (
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs/common"
	"log"
)

var WeaponModels = map[string]string{
	"models/weapons/v_rif_m4a1_s.mdl":                   "m4a1s",
	"models/weapons/w_rif_m4a1_s_dropped.mdl":           "m4a1s",
	"models/weapons/v_rif_m4a1.mdl":                     "m4a4",
	"models/weapons/w_rif_m4a1_dropped.mdl":             "m4a4",
	"models/weapons/v_rif_ak47.mdl":                     "ak47",
	"models/weapons/w_rif_ak47_dropped.mdl":             "ak47",
	"models/weapons/v_snip_awp.mdl":                     "awp",
	"models/weapons/w_snip_awp_dropped.mdl":             "awp",
	"models/weapons/v_pist_glock18.mdl":                 "glock",
	"models/weapons/w_pist_glock18_dropped.mdl":         "glock",
	"models/weapons/v_pist_223.mdl":                     "usp-s",
	"models/weapons/v_knife_default_ct.mdl":             "knife",
	"models/weapons/v_knife_default_t.mdl":              "knife",
	"models/weapons/v_knife_push.mdl":                   "knife",
	"models/weapons/v_knife_falchion_advanced.mdl":      "knife",
	"models/weapons/v_knife_cord.mdl":                   "knife",
	"models/weapons/v_knife_survival_bowie.mdl":         "knife",
	"models/weapons/v_knife_skeleton.mdl":               "knife",
	"models/weapons/v_knife_bayonet.mdl":                "knife",
	"models/weapons/v_knife_outdoor.mdl":                "knife",
	"models/weapons/v_knife_widowmaker.mdl":             "knife",
	"models/weapons/v_knife_tactical.mdl":               "knife",
	"models/weapons/v_knife_butterfly.mdl":              "knife",
	"models/weapons/v_knife_m9_bay.mdl":                 "knife",
	"models/weapons/v_knife_stiletto.mdl":               "knife",
	"models/weapons/v_knife_karam.mdl":                  "knife",
	"models/weapons/v_knife_gut.mdl":                    "knife",
	"models/weapons/v_knife_ursus.mdl":                  "knife",
	"models/weapons/v_knife_canis.mdl":                  "knife",
	"models/weapons/v_knife_gypsy_jackknife.mdl":        "knife",
	"models/weapons/v_knife_flip.mdl":                   "knife",
	"models/weapons/v_knife_css.mdl":                    "knife",
	"models/weapons/v_eq_flashbang.mdl":                 "flash",
	"models/Weapons/w_eq_flashbang_dropped.mdl":         "flash",
	"models/weapons/w_smg_mac10_dropped.mdl":            "mac10",
	"models/weapons/v_smg_mac10.mdl":                    "mac10",
	"models/weapons/v_pist_deagle.mdl":                  "deagle",
	"models/weapons/w_pist_deagle_dropped.mdl":          "deagle",
	"models/weapons/v_smg_ump45.mdl":                    "ump45",
	"models/weapons/v_eq_fraggrenade.mdl":               "he",
	"models/weapons/v_ied.mdl":                          "c4",
	"models/weapons/v_rif_famas.mdl":                    "famas",
	"models/weapons/w_rif_famas_dropped.mdl":            "famas",
	"models/weapons/v_rif_galilar.mdl":                  "galil",
	"models/weapons/w_rif_galilar_dropped.mdl":          "galil",
	"models/weapons/v_eq_smokegrenade.mdl":              "smoke",
	"models/weapons/w_eq_smokegrenade_dropped.mdl":      "smoke",
	"models/weapons/v_pist_p250.mdl":                    "p250",
	"models/weapons/v_pist_tec9.mdl":                    "tec9",
	"models/weapons/v_eq_taser.mdl":                     "taser",
	"models/weapons/w_eq_taser.mdl":                     "taser",
	"models/weapons/v_eq_incendiarygrenade.mdl":         "incendiary",
	"models/Weapons/w_eq_incendiarygrenade_dropped.mdl": "incendiary",
	"models/weapons/v_eq_molotov.mdl":                   "molotov",
	"models/Weapons/w_eq_molotov_dropped.mdl":           "molotov",
	"models/weapons/v_eq_decoy.mdl":                     "decoy",
	"models/weapons/v_smg_p90.mdl":                      "p90",
	"models/weapons/v_smg_mp9.mdl":                      "mp9",
	"models/weapons/w_smg_mp9_dropped.mdl":              "mp9",
	"models/weapons/v_smg_mp7.mdl":                      "mp7",
	"models/weapons/w_smg_mp7_dropped.mdl":              "mp7",
	"models/weapons/v_pist_fiveseven.mdl":               "fiveseven",
	"models/weapons/v_pist_hkp2000.mdl":                 "hkp2000",
	"models/weapons/v_snip_ssg08.mdl":                   "scout",
	"models/weapons/w_snip_ssg08_dropped.mdl":           "scout",
	"models/weapons/v_rif_aug.mdl":                      "aug",
	"models/weapons/w_rif_aug_dropped.mdl":              "aug",
	"models/weapons/v_mach_negev.mdl":                   "negev",
	"models/weapons/v_rif_sg556.mdl":                    "sg556",
	"models/weapons/v_snip_scar20.mdl":                  "scar",
	"models/weapons/v_smg_mp5sd.mdl":                    "mp5",
	"models/weapons/v_shot_mag7.mdl":                    "mag7",
	"models/weapons/v_shot_nova.mdl":                    "nova",
	"models/weapons/v_pist_cz_75.mdl":                   "cz75",
	"models/weapons/v_pist_elite.mdl":                   "duals",
	"models/weapons/v_shot_xm1014.mdl":                  "xm1014",
	"models/weapons/v_snip_g3sg1.mdl":                   "g3sg1",
	"models/weapons/v_smg_bizon.mdl":                    "bizon",
	"models/weapons/v_mach_m249para.mdl":                "para",
}

var WeaponsEqType = map[common.EquipmentType]string{
	common.EqKnife: "knife",

	// pistols
	common.EqUSP:    "usp-s",
	common.EqGlock:  "glock",
	common.EqDeagle: "deagle",

	// smg
	common.EqMac10: "mac10",
	common.EqUMP:   "ump45",

	// rifles
	common.EqAK47:  "ak47",
	common.EqM4A4:  "m4a4",
	common.EqM4A1:  "m4a1s",
	common.EqAWP:   "awp",
	common.EqFamas: "famas",
	common.EqGalil: "galil",

	// nades
	common.EqDecoy:      "decoy",
	common.EqMolotov:    "molotov",
	common.EqIncendiary: "incendiary",
	common.EqFlash:      "flash",
	common.EqSmoke:      "smoke",
	common.EqHE:         "he",

	// eq
	common.EqBomb:      "c4",
	common.EqDefuseKit: "defuse",
}

func convertWeapon(originalName string) string {
	if w, ok := WeaponModels[originalName]; ok {
		return w
	} else {
		log.Printf("model not found '%s'", originalName)
		return "knife"
	}
}
