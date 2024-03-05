const helper = require('../helper.js');
const extracthelper = require('./extracthelper.js');
const manualmap = require('../manualmap.js');

module.exports = extract;

function extract() {
	const xchar = helper.loadJSON('character');
	const xbasecharMap = helper.loadJSONMap('base_character')
	const xvoice = helper.loadJSON('voice_actor');
	const xtitle = helper.loadJSON('original_title');
	const xstatMap = helper.loadJSONMap('character_growth');
	const xgenderMap = helper.loadJSONMap('gender');
	const xcolorMap = helper.loadJSONMap('trait_color');

	return xchar.reduce((accum, charObj) => {
		const data = {};

		data.id = charObj.id;
		data.name = charObj.name;
		data.title = charObj.another_name;

		data.full_name = charObj.fullname;
		data.base_character = xbasecharMap[charObj.base_character_id].name;
		// data.overlayName = charObj.overlay_name;
		// if (charObj.overlay_name !== charObj.fullname) console.log(`char ${data.name} has a different overlay_name`); // other languages have different overlay_name. idk what it's used for

		data.is_alchemist = charObj.is_alchemist;
		data.gender = xgenderMap[xbasecharMap[charObj.base_character_id].gender_id].name;

		data.attribute = manualmap.attributeMap[charObj.attack_attributes[0]];
		if (charObj.attack_attributes.length > 1) console.log(`character ${data.name} has more than one attribute`);
		data.role = manualmap.roleMap[charObj.role];
		if (!data.role) console.log(`character ${data.name} is missing a role`);
		data.initial_rarity = charObj.initial_rarity;

		data.acquisition_text = charObj.acquisition_text;

		data.profile = {};
		data.profile.voice_actor = xvoice.find(v => v.id === charObj.voice_actor_id).name;
		data.profile.voice_text = charObj.profile_voice_text;
		data.profile.description = charObj.description;
		data.profile.origin_game = xtitle.find(t => t.id === charObj.original_title_id).name;
		// series_id

		data.gift_color = {
			received: xcolorMap[charObj.support_color_id].name,
			given: xcolorMap[charObj.trait_color_id].name
		};

		data.battle_item_trait = charObj.battle_tool_trait_ids.map(t => extracthelper.extractBattleItemTrait(t));
		data.equipment_trait = charObj.equipment_tool_trait_ids.map(t => extracthelper.extractEquipmentTrait(t));

		data.stats = {};
		data.stats.base = {
			hp: charObj.initial_status.hp,
			spd: charObj.initial_status.speed,
			patk: charObj.initial_status.attack,
			matk: charObj.initial_status.magic,
			pdef: charObj.initial_status.defense,
			mdef: charObj.initial_status.mental,			
		};
		data.stats.growth = {
			hp: xstatMap[charObj.character_growth_id].level_coefficients.hp,
			spd: xstatMap[charObj.character_growth_id].level_coefficients.speed,
			patk: xstatMap[charObj.character_growth_id].level_coefficients.attack,
			matk: xstatMap[charObj.character_growth_id].level_coefficients.magic,
			pdef: xstatMap[charObj.character_growth_id].level_coefficients.defense,
			mdef: xstatMap[charObj.character_growth_id].level_coefficients.mental,
		};
		data.stats.resistance = {
			fire: charObj.resistance.fire,
			ice: charObj.resistance.ice,
			bolt: charObj.resistance.lightning,
			air: charObj.resistance.wind,
			slash: charObj.resistance.slashing,
			strike: charObj.resistance.impact,
			stab: charObj.resistance.piercing,
		};

		data.skill_1 = extractSkill(charObj.normal1_skill_ids, false);
		data.skill_2 = extractSkill(charObj.normal2_skill_ids, false);
		data.burst = extractSkill(charObj.burst_skill_ids, true);

		data.passive_1 = extractPassive(charObj.ability_ids[0]);
		if (!charObj.ability_ids[1]) console.log(`character ${data.name} is missing a passive)`);
		data.passive_2 = extractPassive(charObj.ability_ids[1]);
		if (charObj.ability_ids[2]) console.log(`character ${data.name} has extra passive)`);
		// data.passive1 = extractPassive(charObj.ability_ids[0]);

		data.start_at = charObj.start_at;

		accum.push(data);
		return accum;
	}, []);
}

function extractSkill(skillIds, isBurst) {
	const xskillMap = helper.loadJSONMap('skill');

	const skillObj = xskillMap[skillIds[0]];

	const data = {};
	data.name = skillObj.name;
	data.description = skillObj.description;
	data.summary = skillObj.summary;
	data.max_level = skillIds.length;
	data.skill_type = isBurst ? "BURST" : "SKILL";
	
	if (skillObj.limit_count !== null) console.log(`skill "${data.name}" has a non-null limit_count`);

	const checkuniqueeffects = new Set(skillIds.map(id => JSON.stringify(xskillMap[id].effects)));
	if (checkuniqueeffects.length > 1) console.log(`skill ${data.name} has different skill effects for different levels`);

	data.effects = extracthelper.extractEffects(skillObj.effects);

	// Attribute
	data.attribute_type = manualmap.attributeTypeMap[skillObj.attack_attribute_category];
	if (!data.attribute_type) console.log(`skill "${data.name}" unmapped attributeType ${skillObj.attack_attribute_category}`);
	data.attribute = manualmap.attributeMap[skillObj.attack_attributes[0]];
	if (skillObj.attack_attributes.length > 1) console.log(`skill ${data.name} has more than one attribute`);
	if (!data.attribute) console.log(`skill "${data.name}" unmapped attribute ${skillObj.attack_attributes[0]}`);

	// Range
	data.target = manualmap.targetMap[skillObj.skill_target_type];
	if (!data.target) console.log(`skill "${data.name} unmapped target ${skillObj.skill_target_type}`);
	data.range = manualmap.rangeMap[skillObj.skill_target_type];
	if (!data.range) console.log(`skill "${data.name} unmapped range ${skillObj.skill_target_type}`);

	// Damage
	data.has_damage = skillObj.skill_power_type === 2;
	if (data.has_damage) data.damage_values = skillIds.map(id => xskillMap[id].power);

	// Stun
	data.has_stun = skillObj.break_power_type === 2;
	if (data.has_stun) data.stun_values = skillIds.map(id => xskillMap[id].break_power);

	// Recover
	data.has_recovery = skillObj.skill_effect_type === 2;
	if (data.has_recovery) data.recovery_values = skillIds.map(id => xskillMap[id].power);

	// Wait
	data.wait = skillObj.wait + 200;

	// image???

	return data;
}

function extractPassive(abilityId) {
	const xabilityMap = helper.loadJSONMap('ability');
	
	const data = {};

	data.name = xabilityMap[abilityId].name;
	data.description = xabilityMap[abilityId].description;

	data.effects = extracthelper.extractEffects(xabilityMap[abilityId].effects);

	return data;
}