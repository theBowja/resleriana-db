const helper = require('../helper.js');
const extracthelper = require('./extracthelper.js');
const manualmap = require('../manualmap.js');

// const xchar = helper.loadJSON('character');
const xitem = helper.loadJSON('item');
const xepisodeMap = helper.loadJSONMap('episode');
// const xbasecharMap = helper.loadJSONMap('base_character')
// const xvoice = helper.loadJSON('voice_actor');
// const xtitle = helper.loadJSON('original_title');
// const xskillMap = helper.loadJSONMap('skill');
// const xbattletrait = helper.loadJSONMap('battle_tool_trait');
// const xequiptrait = helper.loadJSONMap('equipment_tool_trait');
// const xstatMap = helper.loadJSONMap('character_growth');
// const xgenderMap = helper.loadJSONMap('gender');
const xcolorMap = helper.loadJSONMap('trait_color');
const xquest = helper.loadJSON('quest');
const xeventMap = helper.loadJSONMap('event');
const xrewardSetMap = helper.loadJSONMap('reward_set');
const xdropRewardSetMap = helper.loadJSONMap('drop_reward_set');

function extract() {
	return xitem.reduce((accum, obj) => {
        if (obj.item_type !== 1) return accum;

        const data = {};

        data.id = obj.id;
		data.name = obj.name;
        data.rarity = obj.rarity;
        data.color = xcolorMap[obj.trait_color_id].name;
        data.description = obj.description;

        data.battle_item_trait = obj.battle_tool_trait_ids.map(id => extracthelper.extractBattleItemTrait(id));
        data.equipment_trait = obj.equipment_tool_trait_ids.map(id => extracthelper.extractEquipmentTrait(id));

        data.is_from_event = obj.event_id !== null;
        if (data.is_from_event) {
            data.event = {};
            data.event.id = obj.event_id;
            data.event.name = xeventMap[obj.event_id].name;
        }

        let questObjs = xquest.filter(qObj => qObj.sample_rewards.some(r => r.id === obj.id)); // is dungeon
        if (questObjs.length === 0) { // is score battle
            data.available_from = 'SCORE_BATTLES';
            data.source_locations = xquest.reduce((accum, qObj) => {
                if (!qObj.score_battle) return accum;
                if (qObj.score_battle.ranks.at(-1).reward_set_ids.length === 0 &&
                    qObj.score_battle.ranks.at(-1).drop_reward_set_ids.length === 0) return accum;

                const ssReward = qObj.score_battle.ranks.at(-1);
                let rewardSetObjs;
                let quantity;
                if (ssReward.drop_reward_set_ids.length !== 0) { // event score battles
                    const rewardSetIds = ssReward.drop_reward_set_ids;
                    rewardSetObjs = rewardSetIds.map(rId => xdropRewardSetMap[rId])
                    rewardSetObjs = rewardSetObjs.filter(rObj => {
                        return rObj.rewards.some(r => {
                            return r.is_sample && r.rewards.some(rr => {
                                return rr.resource_key.id === obj.id;
                            });
                        });
                    });
                    if (rewardSetObjs.length) quantity = rewardSetObjs[0].rewards.find(r => r.is_sample && r.rewards.some(rr => rr.resource_key.id === obj.id)).quantity;

                } else if (ssReward.reward_set_ids.length !== 0) { // score battles
                    const rewardSetIds = ssReward.reward_set_ids;
                    rewardSetObjs = rewardSetIds.map(rId => xrewardSetMap[rId])
                                                .filter(rObj => rObj.rewards.some(r => r.id === obj.id));
                    if (rewardSetObjs.length) quantity = rewardSetObjs[0].rewards.find(r => r.id === obj.id).quantity
                }

                if (rewardSetObjs.length === 0) return accum;
                if (rewardSetObjs.length > 1) console.log(`extractmaterial ${rewardSetIds} have multiple rewards sets that contain the material`);
                
                accum.push({
                    quest_id: qObj.id,
                    quest_name: qObj.name,
                    difficulty: manualmap.difficultyMap[qObj.difficulty],
                    episode_id: qObj.episode_id,
                    episode_name: xepisodeMap[qObj.episode_id].name,
                    quantity: quantity
                })

                return accum;
            }, []);

        } else {
            data.available_from = 'DUNGEONS';
            data.source_locations = questObjs.map(qObj => ({
                quest_id: qObj.id,
                quest_name: qObj.name,
                episode_id: qObj.episode_id,
                episode_name: xepisodeMap[qObj.episode_id].name
            }));
        }

        data.image_small = `Ingredient_${data.id.toString().padStart(4, '0')}_S`;
        data.image_medium = `Ingredient_${data.id.toString().padStart(4, '0')}_M`;

        data.start_at = obj.start_at;
        data.end_at = obj.end_at;

                
        if (data.source_locations.length === 0 &&
            new Date(obj.start_at) < new Date() &&
            new Date() < new Date(obj.end_at)) {
            console.log(`material ${data.id} has no known source locations`);
        }

		accum.push(data);
        return accum;
    }, []);
}

module.exports = extract;