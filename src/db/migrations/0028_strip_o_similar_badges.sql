-- Custom data migration (drizzle-kit generate --custom), seed v11.
-- The "O similar" cue was retired from Metri Foundations: the swap arrows on the
-- card already say a variant may stand in. The seed only rewrites TEMPLATE rows,
-- so the enrolled copies keep it forever unless stripped here. `updated_at` is
-- stamped so sync pushes the change to the mirror. An emptied list becomes NULL,
-- which is how a slot without cues is stored.
UPDATE `workout_day_exercises`
SET `badges` = NULLIF(
      (SELECT json_group_array(value) FROM json_each(`workout_day_exercises`.`badges`) WHERE value <> 'O similar'),
      '[]'
    ),
    `updated_at` = (unixepoch() * 1000)
WHERE `badges` LIKE '%O similar%';
