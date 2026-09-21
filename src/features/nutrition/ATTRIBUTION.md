# Food data attribution

The nutrient values in [`foods.data.ts`](./foods.data.ts) come from
[USDA FoodData Central](https://fdc.nal.usda.gov) — SR Legacy, April 2018
release — published by the U.S. Department of Agriculture, Agricultural Research
Service, and released into the public domain under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).

> U.S. Department of Agriculture, Agricultural Research Service.
> FoodData Central, 2019. fdc.nal.usda.gov.

Changes made for metri: 146 of the 7,793 foods were selected, values were
rounded to one decimal, and each food was given a metri id plus an English and a
Spanish display name. Calories, protein, carbohydrate, fat and fiber are
otherwise unmodified, and every row keeps its USDA `fdcId` so it can be traced
back to the source record. The selection and the names live in
[`scripts/foods/curated.ts`](../../../scripts/foods/curated.ts).

To regenerate, download the SR Legacy JSON from
<https://fdc.nal.usda.gov/download-datasets> and run:

```bash
bun scripts/build-foods.ts /path/to/FoodData_Central_sr_legacy_food_json_2018-04.json
bun run format
```

The meal ideas and day plans (`meals.ts`, `plans.ts`) are metri's own: they
reference catalogue foods by id and carry no USDA text.

The app's source code is licensed separately and is not a derivative of this
data.
