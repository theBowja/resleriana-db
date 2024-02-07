const helper = require('./helper.js');

const xchar = helper.loadJSON('character');
const xvoice = helper.loadJSON('voice_actor');
const xtitle = helper.loadJSON('original_title');
const xskill = helper.loadJSON('skill')
const xskillMap = {}
xskill.forEach(skillObj => xskillMap[skillObj.id] = skillObj);

function extract() {
	return xchar.reduce((accum, charObj) => {
		const data = {};

		data.id = charObj.id;
		data.name = charObj.name;
		data.title = charObj.another_name;

		data.fullName = charObj.fullname;
		// data.overlayName = charObj.overlay_name;
		if (charObj.overlay_name !== charObj.fullname) console.log(`char ${data.name} has a different overlay_name`);

		data.profile = {};
		data.profile.voiceActor = xvoice.find(v => v.id === charObj.voice_actor_id).name;
		data.profile.voiceText = charObj.profile_voice_text;
		data.profile.description = charObj.description;
		data.profile.originalTitle = xtitle.find(t => t.id === charObj.original_title_id).name;
		// series_id

		data.isAlchemist = charObj.is_alchemist;

		data.baseStats = {
			rarity: charObj.initial_rarity,
			hp: charObj.initial_status.hp,
			spd: charObj.initial_status.speed,
			patk: charObj.initial_status.attack,
			matk: charObj.initial_status.magic,
			pdef: charObj.initial_status.defense,
			mdef: charObj.initial_status.mental,			
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

		accum.push(data);
		return accum;
	}, []);
}

function extractSkill(skillIds) {
	const skillObj = xskillMap[skillIds[0]];

	const data = {};
	data.name = skillObj.name;
	data.description = skillObj.description;
	data.summary = skillObj.summary;
	data.maxLevel = skillIds.length;

	if (skillObj.limit_count !== null) console.log(`skill "${data.name}" has a non-null limit_count`);

	// Attribute
	data.attributeType = helper.attributeTypeMap[skillObj.attack_attribute_category];
	if (!data.attributeType) console.log(`skill "${data.name}" unmapped attributeType ${skillObj.attack_attribute_category}`);
	data.attribute = helper.attributeMap[skillObj.attack_attributes[0]];
	if (skillObj.attack_attributes.length > 1) console.log(`skill ${data.name} has more than one attribute`);
	if (!data.attribute) console.log(`skill "${data.name}" unmapped attribute ${skillObj.attack_attributes[0]}`);

	// Range
	data.target = helper.targetMap[skillObj.skill_target_type];
	if (!data.target) console.log(`skill "${data.name} unmapped target ${skillObj.skill_target_type}`);
	data.range = helper.rangeMap[skillObj.skill_target_type];
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

module.exports = extract;