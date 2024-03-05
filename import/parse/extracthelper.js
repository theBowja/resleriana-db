const helper = require('../helper.js');
const manualmap = require('../manualmap.js');

module.exports = {
    extractBattleItemTrait,
    extractEquipmentTrait,
    extractEffects
}

function extractBattleItemTrait(traitId) {
	const xeffectMap = helper.loadJSONMap('effect');
	const xbattletrait = helper.loadJSONMap('battle_tool_trait');

	const data = {};

	data.id = traitId;
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

function extractEffects(effectData) {
	const xeffectMap = helper.loadJSONMap('effect');
	
	return effectData.map(e => ({
		id: e.id,
		description: xeffectMap[e.id].description,
		value: e.value,
		values: e.values
	}));
}

function extractEquipmentTrait(traitId) {
	const xequiptrait = helper.loadJSONMap('equipment_tool_trait');
	const xabilityMap = helper.loadJSONMap('ability');

	const data = {};

	data.id = traitId;
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