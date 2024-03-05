const helper = require('../helper.js');
const manualmap = require('../manualmap.js');

module.exports = extract;

function extract() {
    const xquest = helper.loadJSON('quest');
    const xepisodeMap = helper.loadJSONMap('episode');

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