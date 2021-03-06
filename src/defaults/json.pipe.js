/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const { Pipeline } = require('../../index.js');
const { log } = require('./default.js');

const fetch = require('../html/fetch-markdown.js');
const parse = require('../html/parse-markdown.js');
const meta = require('../html/get-metadata.js');
const type = require('../utils/set-content-type.js');
const smartypants = require('../html/smartypants.js');
const sections = require('../html/split-sections.js');
const production = require('../utils/is-production.js');
const dump = require('../utils/dump-context.js');
const validate = require('../utils/validate.js');
const emit = require('../json/emit-json.js');
const { selectStatus } = require('../json/set-json-status.js');
const parseFrontmatter = require('../html/parse-frontmatter.js');

/* eslint no-param-reassign: off */
/* eslint newline-per-chained-call: off */

const jsonpipe = (cont, payload, action) => {
  action.logger = action.logger || log;
  action.logger.log('debug', 'Constructing JSON Pipeline');
  const pipe = new Pipeline(action);
  pipe
    .every(dump).when(() => !production())
    .every(validate).when(() => !production())
    .before(fetch).expose('fetch')
    .before(parse).expose('parse')
    .before(parseFrontmatter)
    .before(smartypants)
    .before(sections)
    .before(meta).expose('meta')
    .once(cont)
    .after(emit).expose('json')
    .after(type('application/json'))
    .error(selectStatus(production()));

  action.logger.log('debug', 'Running JSON pipeline');
  return pipe.run(payload);
};

module.exports.pipe = jsonpipe;
