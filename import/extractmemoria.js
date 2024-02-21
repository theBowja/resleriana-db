const helper = require('./helper.js');
// const manualmap = require('./manualmap.js');

// const xchar = helper.loadJSON('character');
const xmemoria = helper.loadJSON('memoria');
const xmemoriaGrow = helper.loadJSONMap('memoria_buff_growth');
// const xbasecharMap = helper.loadJSONMap('base_character')
// const xvoice = helper.loadJSON('voice_actor');
// const xtitle = helper.loadJSON('original_title');
// const xskillMap = helper.loadJSONMap('skill');
const xeffectMap = helper.loadJSONMap('effect');
const xabilityMap = helper.loadJSONMap('ability');
// const xbattletrait = helper.loadJSONMap('battle_tool_trait');
// const xequiptrait = helper.loadJSONMap('equipment_tool_trait');
// const xstatMap = helper.loadJSONMap('character_growth');
// const xgenderMap = helper.loadJSONMap('gender');

function extract() {
	return xmemoria.reduce((accum, memObj) => {
        const data = {};

        data.id = memObj.id;
		data.name = memObj.name;
        data.rarity = memObj.rarity;
        data.description = memObj.description;
        data.ability = extractAbility(memObj.ability_ids, data.name);

        // start_at
        data.stats = {};
        data.stats.hp = xmemoriaGrow[memObj.status_buffs.find(stat => stat.type === 1).growth_id].values;
        data.stats.spd = xmemoriaGrow[memObj.status_buffs.find(stat => stat.type === 2).growth_id].values;
        data.stats.patk = xmemoriaGrow[memObj.status_buffs.find(stat => stat.type === 3).growth_id].values;
        data.stats.matk = xmemoriaGrow[memObj.status_buffs.find(stat => stat.type === 4).growth_id].values;
        data.stats.pdef = xmemoriaGrow[memObj.status_buffs.find(stat => stat.type === 5).growth_id].values;
        data.stats.mdef = xmemoriaGrow[memObj.status_buffs.find(stat => stat.type === 6).growth_id].values;
        if (!memObj.status_buffs.every(stat => stat.initial_values.every(v => v === 0))) {
            console.log(`memoria ${data.name} has initial stat values. redo calculations`);
        }

        data.start_at = memObj.start_at;

		accum.push(data);
        return accum;
    }, []);
}

function extractAbility(abilityIds, debugName) {
    const data = {};
    data.id = abilityIds[0];

    const abilityObjs = abilityIds.map(id => xabilityMap[id]);
    data.name = abilityObjs[0].name;
	data.description = abilityObjs[0].description;

	const checkuniquedescription = new Set(abilityObjs.map(obj => obj.description));
	if (checkuniquedescription.length > 1) console.log(`ability ${debugName} has different ability description for different levels`);
	const checkuniqueeffectid = new Set(abilityObjs.map(obj => JSON.stringify(obj.effects.map(e => e.id))));
	if (checkuniqueeffectid.length > 1) console.log(`ability ${debugName} has different effect ids for different levels`);

    const effectData = abilityObjs[0].effects.map((e, i) => {
		return {
			id: e.id,
			values: abilityObjs.map(a => a.effects[i].value)
		}
	});
    data.effects = extractEffects(effectData);

    return data;
}

function extractEffects(effectData) {
	return effectData.map(e => ({
		id: e.id,
        name: xeffectMap[e.id].name,
		description: xeffectMap[e.id].description,
		value: e.value,
		values: e.values
	}));
}

module.exports = extract;