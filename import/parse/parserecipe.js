const helper = require('../helper.js');
const manualmap = require('../manualmap.js');

module.exports = extract;

function extract() {
    const xrecipe = helper.loadJSON('recipe');
    const xmaterialMap = helper.loadJSONMap('item');
    const xrecipePlanMap = helper.loadJSONMap('recipe_plan');

	return xrecipe.reduce((accum, obj) => {
        const data = {};

        data.id = obj.id;
		data.name = obj.name;

        data.ingredients = obj.ingredient_costs.map(ing => {
            return {
                material_id: ing.id,
                name: xmaterialMap[ing.id].name,
                quantity: ing.quantity
            };
        });

        data.group = {};
        data.group.tab = "";
        data.group.name = xrecipePlanMap[obj.recipe_plan_id].name;
        data.group.abbreviation = xrecipePlanMap[obj.recipe_plan_id].abbreviation.replaceAll('\n', ' ');

        data.requirements = obj.requirements.map(r => r.name);

        data.support_character_ids = obj.support_character_ids;
        data.support_color_ids = obj.support_color_ids;

        data.start_at = obj.start_at;

		accum.push(data);
        return accum;
    }, []);
}