const helper = require('./helper.js');
const manualmap = require('./manualmap.js');

const xchar = helper.loadJSON('character');
const xbasecharMap = helper.loadJSONMap('base_character')
const xvoice = helper.loadJSON('voice_actor');
const xtitle = helper.loadJSON('original_title');
const xskillMap = helper.loadJSONMap('skill');
const xeffectMap = helper.loadJSONMap('effect');
const xabilityMap = helper.loadJSONMap('ability');
const xbattletrait = helper.loadJSONMap('battle_tool_trait');
const xequiptrait = helper.loadJSONMap('equipment_tool_trait');
const xstatMap = helper.loadJSONMap('character_growth');

function extract() {
	return xchar.reduce((accum, charObj) => {
		const data = {};

		data.id = charObj.id;
		data.name = charObj.name;
		data.title = charObj.another_name;

		data.fullName = charObj.fullname;
		data.baseCharacter = xbasecharMap[charObj.base_character_id].name;
		// data.overlayName = charObj.overlay_name;
		if (charObj.overlay_name !== charObj.fullname) console.log(`char ${data.name} has a different overlay_name`);

		data.isAlchemist = charObj.is_alchemist;
		data.gender = manualmap.genderMap[xbasecharMap[charObj.base_character_id].gender_id];

		data.attribute = manualmap.attributeMap[charObj.attack_attributes[0]];
		if (charObj.attack_attributes.length > 1) console.log(`character ${data.name} has more than one attribute`);
		data.role = manualmap.roleMap[charObj.role];
		if (!data.role) console.log(`character ${data.name} is missing a role`);
		data.initialRarity = charObj.initial_rarity;

		data.acquisitionText = charObj.acquisition_text;

		data.profile = {};
		data.profile.voiceActor = xvoice.find(v => v.id === charObj.voice_actor_id).name;
		data.profile.voiceText = charObj.profile_voice_text;
		data.profile.description = charObj.description;
		data.profile.originGame = xtitle.find(t => t.id === charObj.original_title_id).name;
		// series_id

		data.giftColor = {
			received: manualmap.colorMap[charObj.support_color_id],
			given: manualmap.colorMap[charObj.trait_color_id]
		};

		data.traits = {
			battleItem: charObj.battle_tool_trait_ids.map(t => extractBattleItemTrait(t)),
			equipment: charObj.equipment_tool_trait_ids.map(t => extractEquipmentTrait(t))
		};

		data.baseStats = {
			hp: charObj.initial_status.hp,
			spd: charObj.initial_status.speed,
			patk: charObj.initial_status.attack,
			matk: charObj.initial_status.magic,
			pdef: charObj.initial_status.defense,
			mdef: charObj.initial_status.mental,			
		};
		data.statGrowth = {
			hp: xstatMap[charObj.character_growth_id].level_coefficients.hp,
			spd: xstatMap[charObj.character_growth_id].level_coefficients.speed,
			patk: xstatMap[charObj.character_growth_id].level_coefficients.attack,
			matk: xstatMap[charObj.character_growth_id].level_coefficients.magic,
			pdef: xstatMap[charObj.character_growth_id].level_coefficients.defense,
			mdef: xstatMap[charObj.character_growth_id].level_coefficients.mental,
		};
		data.resistance = {
			fire: charObj.resistance.fire,
			ice: charObj.resistance.ice,
			bolt: charObj.resistance.lightning,
			air: charObj.resistance.wind,
			slash: charObj.resistance.slashing,
			strike: charObj.resistance.impact,
			stab: charObj.resistance.piercing,
		};
		// stat growth

		data.skill1 = extractSkill(charObj.normal1_skill_ids);
		data.skill2 = extractSkill(charObj.normal2_skill_ids);
		data.burst = extractSkill(charObj.burst_skill_ids);

		data.passive1 = extractPassive(charObj.ability_ids[0]);
		if (!charObj.ability_ids[1]) console.log(`character ${data.name} is missing a passive)`);
		data.passive2 = extractPassive(charObj.ability_ids[1]);
		if (charObj.ability_ids[2]) console.log(`character ${data.name} has extra passive)`);
		// data.passive1 = extractPassive(charObj.ability_ids[0]);

		accum.push(data);
		return accum;
	}, []);
}

function extractBattleItemTrait(traitId) {
	const data = {};

	// data.id = traitId;
	data.name = xbattletrait[traitId].name;
	data.category = manualmap.categoryMap[xbattletrait[traitId].category_id];

	data.description = xbattletrait[traitId].description;
	if (data.description === '') { // this means we only have one effect and should grab description from effect
		if (xbattletrait[traitId].effects.length !== 1) console.log(`battle item trait ${data.name} has an unexpected amount of effects`);
		data.description = xeffectMap[xbattletrait[traitId].effects[0].id].description;
	}

	data.effects = extractEffects(xbattletrait[traitId].effects);

	return data;
}

function extractEquipmentTrait(traitId) {
	const data = {};

	// data.id = traitId;
	data.name = xequiptrait[traitId].name;
	data.category = manualmap.categoryMap[xequiptrait[traitId].category_id];

	const abilityObjs = xequiptrait[traitId].ability_ids.map(id => xabilityMap[id]);

	data.description = abilityObjs[0].description;

	const checkuniquedescription = new Set(abilityObjs.map(obj => obj.description));
	if (checkuniquedescription.length > 1) console.log(`equipment trait ${data.name} has different ability description for different levels`);
	const checkuniqueeffectid = new Set(abilityObjs.map(obj => JSON.stringify(obj.effects.map(e => e.id))));
	if (checkuniqueeffectid.length > 1) console.log(`equipment trait ${data.name} has different effect ids for different levels`);

	// combine the effect values into a single array to maintain consistency with battle item trait effect values
	const effectData = abilityObjs[0].effects.map((e, i) => {
		return {
			id: e.id,
			values: abilityObjs.map(a => a.effects[i].value)
		}
	});

	data.effects = extractEffects(effectData);
	if (data.effects.length > 1) console.log(data.effects);

	return data;
}

function extractSkill(skillIds) {
	const skillObj = xskillMap[skillIds[0]];

	const data = {};
	data.name = skillObj.name;
	data.description = skillObj.description;
	data.summary = skillObj.summary;
	data.maxLevel = skillIds.length;

	if (skillObj.limit_count !== null) console.log(`skill "${data.name}" has a non-null limit_count`);

	const checkuniqueeffects = new Set(skillIds.map(id => JSON.stringify(xskillMap[id].effects)));
	if (checkuniqueeffects.length > 1) console.log(`skill ${data.name} has different skill effects for different levels`);

	data.effects = extractEffects(skillObj.effects);

	// Attribute
	data.attributeType = manualmap.attributeTypeMap[skillObj.attack_attribute_category];
	if (!data.attributeType) console.log(`skill "${data.name}" unmapped attributeType ${skillObj.attack_attribute_category}`);
	data.attribute = manualmap.attributeMap[skillObj.attack_attributes[0]];
	if (skillObj.attack_attributes.length > 1) console.log(`skill ${data.name} has more than one attribute`);
	if (!data.attribute) console.log(`skill "${data.name}" unmapped attribute ${skillObj.attack_attributes[0]}`);

	// Range
	data.target = manualmap.targetMap[skillObj.skill_target_type];
	if (!data.target) console.log(`skill "${data.name} unmapped target ${skillObj.skill_target_type}`);
	data.range = manualmap.rangeMap[skillObj.skill_target_type];
	if (!data.range) console.log(`skill "${data.name} unmapped range ${skillObj.skill_target_type}`);

	// Damage
	data.hasDamage = skillObj.skill_power_type === 2;
	if (data.hasDamage) data.damageValues = skillIds.map(id => xskillMap[id].power);

	// Stun
	data.hasStun = skillObj.break_power_type === 2;
	if (data.hasStun) data.stunValues = skillIds.map(id => xskillMap[id].break_power);

	// Recover
	data.hasRecovery = skillObj.skill_effect_type === 2;
	if (data.hasRecovery) data.recoveryValues = skillIds.map(id => xskillMap[id].power);

	// Wait
	data.wait = skillObj.wait + 200;

	// image???

	return data;
}

function extractEffects(effectData) {
	return effectData.map(e => ({
		id: e.id,
		description: xeffectMap[e.id].description,
		value: e.value,
		values: e.values
	}));
}

function extractPassive(abilityId) {
	const data = {};

	data.name = xabilityMap[abilityId].name;
	data.description = xabilityMap[abilityId].description;

	data.effects = extractEffects(xabilityMap[abilityId].effects);

	return data;
}

module.exports = extract;