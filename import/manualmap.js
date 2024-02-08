module.exports = {

	attributeTypeMap: {
		null: 'NONE',
		1: 'PHYSICAL',
		2: 'MAGIC'
	},

	attributeMap: {
		1: 'SLASH',
		2: 'STRIKE',
		3: 'STAB',

		5: 'FIRE',
		6: 'ICE',
		7: 'BOLT',
		8: 'AIR',
	},

	targetMap: {
		2: 'ALLY', // one
		3: 'ENEMY', // one
		4: 'ALLY', // all
		5: 'ENEMY', // all
	},

	rangeMap: {
		2: 'ONE', // ally
		3: 'ONE', // enemy
		4: 'ALL', // ally
		5: 'ALL', // enemy
	},

	colorMap: {
		1: 'BLUE',
		2: 'PURPLE',
		3: 'YELLOW',
		4: 'RED',
		5: 'GREEN',
	},

	categoryMap: {
		1: 'ATTACK',
		2: 'ENHANCE',
		3: 'WEAKENING',
		4: 'RECOVERY',
	},

	genderMap: {
		1: 'MALE',
		2: 'FEMALE',
	},

	roleMap: {
		1: 'ATTACKER',
		2: 'BREAKER',
		3: 'DEFENDER',
		4: 'SUPPORTER',
	},

	nodeType: {
		1: 'CORE',
		2: 'LIGHT',
		3: 'EX HP CORE', // ??????
		4: 'SINGLE_STAR',
		5: 'DUAL_STAR',
		6: 'SYNTHESIS',
		7: 'LIMIT UNLOCKED',
	},

	growboardNodeMap: {
		1: 'PATK_CORE', // type 1, status type 3
		2: 'PDEF_CORE', // type 1, status type 5
		3: 'HP_CORE', // type 1, status type 1
		4: 'MATK_CORE', // type 1, status type 4
		5: 'MDEF_CORE', // type 1, status type 6
		5: 'BREAKERS_LIGHT', // type 2, status type 1
		5: 'ATTACKERS_LIGHT', // type 2, status type 6
		6: 'SKILL_CORE_SINGLE_STAR', // type 4
		7: 'SKILL_CORE_DUAL_STAR', // type 5
		6: 'SYNTHESIS', // type 6
		7: 'LIMIT_UNLOCKED', // type 7
	},













	attributeTypeMap: {
		null: 'NONE',
		1: 'PHYSICAL',
		2: 'MAGIC'
	},

	attributeMap: {
		1: 'SLASH',
		2: 'STRIKE',
		3: 'STAB',

		5: 'FIRE',
		6: 'ICE',
		7: 'BOLT',
		8: 'AIR',
	},

	targetMap: {
		2: 'ALLY', // one
		3: 'ENEMY', // one
		4: 'ALLY', // all
		5: 'ENEMY', // all
	},

	rangeMap: {
		2: 'ONE', // ally
		3: 'ONE', // enemy
		4: 'ALL', // ally
		5: 'ALL', // enemy
	},

	color: {
		1: 'BLUE',
		2: 'PURPLE',
		3: 'YELLOW',
		4: 'RED',
		5: 'GREEN',
	},

	category: {
		1: 'ATTACK',
		2: 'ENHANCE',
		3: 'WEAKENING',
		4: 'RECOVERY',
	},

	genderMap: {
		1: 'MALE',
		2: 'FEMALE',
	},

	roleMap: {
		1: 'ATTACKER',
		2: 'BREAKER',
		3: 'DEFENDER',
		4: 'SUPPORTER',
	},

	nodeType: {
		1: 'CORE',
		2: 'LIGHT',
		3: 'EX HP CORE', // ??????
		4: 'SINGLE_STAR',
		5: 'DUAL_STAR',
		6: 'SYNTHESIS',
		7: 'LIMIT UNLOCKED',
	},

	growboardNodeMap: {
		1: 'PATK_CORE', // type 1, status type 3
		2: 'PDEF_CORE', // type 1, status type 5
		3: 'HP_CORE', // type 1, status type 1
		4: 'MATK_CORE', // type 1, status type 4
		5: 'MDEF_CORE', // type 1, status type 6
		5: 'BREAKERS_LIGHT', // type 2, status type 1
		5: 'ATTACKERS_LIGHT', // type 2, status type 6
		6: 'SKILL_CORE_SINGLE_STAR', // type 4
		7: 'SKILL_CORE_DUAL_STAR', // type 5
		6: 'SYNTHESIS', // type 6
		7: 'LIMIT_UNLOCKED', // type 7
	},
}