const helper = require('./helper.js');
const manualmap = require('./manualmap.js');

// const xchar = helper.loadJSON('character');
const xquest = helper.loadJSON('quest');
const xepisodeMap = helper.loadJSONMap('episode');
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
	return xquest.reduce((accum, obj) => {
        const data = {};

        data.id = obj.id;
		data.name = obj.name;

        data.quest_type = manualmap.questTypeMap[obj.quest_type];

        data.episode = {};
        data.episode.id = obj.episode_id;
        data.episode.name = xepisodeMap[obj.episode_id].name;
        data.episode.description = xepisodeMap[obj.episode_id].description;        
        data.episode.episode_type = manualmap.episodeMap[obj.episode_type];

        data.recommended_combat_power = obj.recommended_combat_power;
        data.stamina = obj.stamina;

        // data.description = obj.description;

        data.battle_info = {};
        // data.battle_info.recommended_attributes
        // data.battle_info.blessings
        // data.battle_info.appearing_panels
        // data.battle_info.tips

        // data.enemies

        data.start_at = obj.start_at;
        data.end_at = obj.end_at;

		accum.push(data);
        return accum;
    }, []);
}

module.exports = extract;