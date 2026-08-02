# Changelog

## [1.6.0](https://github.com/Ricwolf19/metri/compare/metri-v1.5.1...metri-v1.6.0) (2026-08-02)


### Features

* **app:** four-tab shell and header redesign ([a2acf3c](https://github.com/Ricwolf19/metri/commit/a2acf3cd06eb362c772fa91c7f11f3fc42337ff8))
* **auth:** restore the account profile on sign-in ([ea7c004](https://github.com/Ricwolf19/metri/commit/ea7c0040dc084543c582c351bac8b28f88f93f7e))
* **notifications:** event catalogue replaces reminders ([6021cb2](https://github.com/Ricwolf19/metri/commit/6021cb22c5d5ad4528ec1117c639a29657af1835))
* **telemetry:** sentry behind a single gateway ([05dd605](https://github.com/Ricwolf19/metri/commit/05dd60543556c9780c5505cfe59f3cfba9c0bb5d))


### Performance Improvements

* **sync:** device id, cooldown and backoff ([ad8c494](https://github.com/Ricwolf19/metri/commit/ad8c494e9ab8c8419cf066e2346c42ad8bc161f7))

## [1.5.1](https://github.com/Ricwolf19/metri/compare/metri-v1.5.0...metri-v1.5.1) (2026-07-30)


### Bug Fixes

* **config:** fail safe to the production api url ([8d17a31](https://github.com/Ricwolf19/metri/commit/8d17a3199b904e73cee4c97f355cc7f641c25a9b))

## [1.5.0](https://github.com/Ricwolf19/metri/compare/metri-v1.4.0...metri-v1.5.0) (2026-07-29)


### Features

* **beta:** add an in-app beta programme screen and home banner ([a9f7bad](https://github.com/Ricwolf19/metri/commit/a9f7baddf992795e5c12ed0215177e913848fc49))


### Bug Fixes

* **ci:** download the eas artifact and ship on the beta channel ([ee98d84](https://github.com/Ricwolf19/metri/commit/ee98d84d4154c5e90932a121fa9bcea4758f7579))
* **updates:** track the native layer with a fingerprint runtime version ([d42b072](https://github.com/Ricwolf19/metri/commit/d42b0728314e520ba2c006631368f37bfcaec846))

## [1.4.0](https://github.com/Ricwolf19/metri/compare/metri-v1.3.0...metri-v1.4.0) (2026-07-29)


### Features

* **sync:** automatic sync with an avatar status ring ([937c248](https://github.com/Ricwolf19/metri/commit/937c248c9981a4ba6c1bc477c3fda64bf6ac906f))


### Bug Fixes

* **auth:** drop legacy on-device password storage ([730180b](https://github.com/Ricwolf19/metri/commit/730180baacc40769649bac62de7e0b216256b88a))
* **security:** validate the session and scope photo access ([6d69f1b](https://github.com/Ricwolf19/metri/commit/6d69f1b4cfc63696059d9b32ceb8500cb02ea76b))
* **sync:** isolate row apply and page the pull ([6a588e5](https://github.com/Ricwolf19/metri/commit/6a588e5dafef05902fa271989a38308a21ea571d))

## [1.3.0](https://github.com/Ricwolf19/metri/compare/metri-v1.2.0...metri-v1.3.0) (2026-07-28)


### Features

* **auth:** remote better-auth, entitlements and premium ([1752598](https://github.com/Ricwolf19/metri/commit/17525980fc16efa3153e56db735d31d630c0a93f))
* **calculators:** data-driven calculator suite ([1c9b182](https://github.com/Ricwolf19/metri/commit/1c9b182302c135011d9d1988c51c2ee3ee114b65))
* **db:** schema and migrations for training, adherence and sync ([d32119e](https://github.com/Ricwolf19/metri/commit/d32119e6b63ab3f92502cf34b19f586d10e0773f))
* **docs:** refresh in-app documentation ([12f6630](https://github.com/Ricwolf19/metri/commit/12f6630f01649517b04f1268b98ab8b9ceb477ac))
* **i18n:** translations for training, adherence, editor and sync ([37c2c69](https://github.com/Ricwolf19/metri/commit/37c2c6927ebc158c1673f1cb8337357f1842c954))
* **sync:** premium sqlite-neon delta sync engine ([800c158](https://github.com/Ricwolf19/metri/commit/800c158e6f5db9bc2cf63462178c13ce0dea233a))
* **theme:** design tokens, theme context and tailwind config ([9066606](https://github.com/Ricwolf19/metri/commit/90666065fd65e0078ff2b5fcaa8a748f01d9de8d))
* **training:** logging, rest timer, adherence, dashboard and editor ([ec55234](https://github.com/Ricwolf19/metri/commit/ec55234ad481f73c215d7470d2ef09162e29a3e0))
* **ui:** component primitives, icons and switch adoption ([7f92729](https://github.com/Ricwolf19/metri/commit/7f927293cfd93ea184709c223c722bea4470bfe2))


### Bug Fixes

* **deps:** align expo packages with sdk 56 ([329bf35](https://github.com/Ricwolf19/metri/commit/329bf35173f2b4484dff9ecf809b9a5668caf25d))

## [1.2.0](https://github.com/Ricwolf19/metri/compare/metri-v1.1.0...metri-v1.2.0) (2026-06-13)


### Features

* **calculators:** add FFMI (Fat-Free Mass Index) tool ([f42bb68](https://github.com/Ricwolf19/metri/commit/f42bb68e3efe6cf63bd5e82dff11443009c696ce))
* **db:** add schema and migrations for the new training system ([0e03913](https://github.com/Ricwolf19/metri/commit/0e039135d1d108729066feb4d3ffc21bac43d36f))
* **docs:** expand knowledge base content and integrate with calculators ([bff6390](https://github.com/Ricwolf19/metri/commit/bff639091b28eacc225a747b9b56f0c5e394792e))
* **home:** implement customizable quick actions on the home screen ([83a8bfe](https://github.com/Ricwolf19/metri/commit/83a8bfee5b6917845de3ed04fbb209ff3cd3becc))
* **i18n:** add translations for the training module ([a6e51e1](https://github.com/Ricwolf19/metri/commit/a6e51e1f991694c036b47fb105577106c7860706))
* **i18n:** update translations for new calculators, reminders, and profile settings ([6884f35](https://github.com/Ricwolf19/metri/commit/6884f355fd1ec7281dfe75e1a43a26bc0e05c187))
* **profile:** add time format preference (12h/24h) and update time picker ([1920ab4](https://github.com/Ricwolf19/metri/commit/1920ab44b504615d90eb02407db6434c1bf810e8))
* **reminders:** support multiple weekdays and adapt to time format preference ([ba98e83](https://github.com/Ricwolf19/metri/commit/ba98e833e189e2183c039edaf8632c3ddba98d82))
* **storage:** add global keys for clock format and home actions ([3ba9d9a](https://github.com/Ricwolf19/metri/commit/3ba9d9a80efea93c6cf13a9842c5b40e8592aedf))
* **training:** implement training engine, UI, templates and quick actions ([384e1a0](https://github.com/Ricwolf19/metri/commit/384e1a068d502d83047bedbc43b07fba2918bfe0))

## [1.1.0](https://github.com/Ricwolf19/metri/compare/metri-v1.0.0...metri-v1.1.0) (2026-06-13)


### Features

* add fast MMKV storage extensions for locale and session state ([b17d009](https://github.com/Ricwolf19/metri/commit/b17d009e54e4eac6722ea3ec324f7eb4e457cb9b))
* add reusable UI primitives and icon set ([6158ddc](https://github.com/Ricwolf19/metri/commit/6158ddcdf681367d2c5bbcef041d610abf6d86a9))
* add user schema and database migrations for local auth ([66578c0](https://github.com/Ricwolf19/metri/commit/66578c0b6ae821d5f65f9f4a2aacbd18f63269d4))
* **auth:** extend user repository and role badge ([05059b2](https://github.com/Ricwolf19/metri/commit/05059b2ece72795130017ed276d10300048b1c70))
* **calculators:** add BMR, macros, 1RM, body-fat, water and ideal-weight tools ([d21995f](https://github.com/Ricwolf19/metri/commit/d21995fc45d29acc4590bf55998cf16c4409d121))
* **db:** extend schema with profile, reminders and progress photos ([1cadcf4](https://github.com/Ricwolf19/metri/commit/1cadcf473ef19011ba35d61b9fbc79dc2a211d17))
* **docs:** add bilingual searchable knowledge base ([18e65c7](https://github.com/Ricwolf19/metri/commit/18e65c7aacfaa07bffc54b4ea20e9f540c683398))
* **i18n:** add EN/ES dictionary, provider and locale toggle ([4f67fc0](https://github.com/Ricwolf19/metri/commit/4f67fc0d2a859c3696a135b42cb18e6e98c2414d))
* implement BMR calculator logic and screens ([53af152](https://github.com/Ricwolf19/metri/commit/53af15294c4bf1ec6ccf282c15110431524c2178))
* implement i18n support for english and spanish ([50189e7](https://github.com/Ricwolf19/metri/commit/50189e778e8b030d64acb583e30e132670a9c72a))
* implement local authentication and secure crypto utilities ([0fe52b3](https://github.com/Ricwolf19/metri/commit/0fe52b322e2e4f19b34e53991a0ca03807074413))
* **legal:** add in-app terms and privacy screen ([44400c7](https://github.com/Ricwolf19/metri/commit/44400c7d8ae420afd0d0f5bc168d09e658e063fa))
* **navigation:** wire tabbed shell, onboarding and auth screens ([b46a4a8](https://github.com/Ricwolf19/metri/commit/b46a4a8afbcdf08e0b5b0647eed671e730b661d8))
* **photos:** add progress photos with period grouping and compare ([fa76e91](https://github.com/Ricwolf19/metri/commit/fa76e918b6dfd12fc74a527709b6742e54780b5e))
* **reminders:** add scheduled local-notification reminders ([7e4ee25](https://github.com/Ricwolf19/metri/commit/7e4ee2598243a221590958eb9ef2c93b6e2c74ef))
* setup app routing, auth layouts, tabs shell, and onboarding flow ([9c165da](https://github.com/Ricwolf19/metri/commit/9c165da5bdb12289655a74b9a95e37c224747c64))
* **storage:** persist locale, theme and onboarding state in MMKV ([d0660c6](https://github.com/Ricwolf19/metri/commit/d0660c67d61dc08ad8800f2a61d361fbf3f25123))
* **theme:** add light/dark/system theming with CSS-variable tokens ([d932d34](https://github.com/Ricwolf19/metri/commit/d932d34c0d56ffa6a8858f438eb0b83f3a26be7a))
* **ui:** add reusable primitives, wheel pickers and animations ([52cb2dd](https://github.com/Ricwolf19/metri/commit/52cb2dd696c3429b1dbdf3bc2956921bdf66cce2))
