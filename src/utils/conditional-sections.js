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

const hash = require('object-hash');
const { setdefault, type } = require('@adobe/helix-shared').types;
const { each } = require('@adobe/helix-shared').sequence;

function selectstrain(context, { request, logger }) {
  const cont = setdefault(context, 'content', {});
  const params = request.params || {};
  const { strain } = params;
  const { sections } = cont;

  if (!strain || !sections) {
    return;
  }

  logger.debug(`Filtering sections not intended for strain ${strain}`);
  each(sections, (section) => {
    const meta = setdefault(section, 'meta', {});

    // QUESTION FOR REVIEW: Why don't we just make sure the 'strain' property
    // always is a list? Possibly a list of one…
    // If we really need to support setting the strain as a string, IMO it would
    // be better to include proper data normalization steps (maybe inbetween each
    // pipeline step?); having to assume everything coming in may be undefined or
    // having weird values and fixing it on the fly is a lot of work and hides the
    // actual purpose of the code we are writing…
    const strainList = type(meta.strain) === Array ? meta.strain : [meta.strain];
    section.hidden = !strainList.includes(strain);
  });
}

function testgroups(sections = []) {
  return sections
    .filter(({ meta = {} } = {}) => !!meta.test)
    .reduce((groups, section) => {
      if (groups[section.meta.test]) {
        groups[section.meta.test].push(section);
      } else {
        groups[section.meta.test] = [section];
      }
      return groups;
    }, {});
}

/**
 * Generate a stable sort order based on a random seed.
 * @param {String} strain random seed
 */
function strainhashsort(strain = 'default') {
  return function compare(left, right) {
    const lhash = hash({ strain, val: left });
    const rhash = hash({ strain, val: right });
    return lhash.localeCompare(rhash);
  };
}

function pick(groups = {}, strain = 'default') {
  return Object.keys(groups)
    .reduce((selected, group) => {
      const candidates = groups[group];
      candidates.sort(strainhashsort(strain));
      if (candidates.length) {
        [selected[group]] = candidates; // eslint prefers array destructing here
      }
      return selected;
    }, {});
}

function selecttest(context, { request }) {
  const cont = setdefault(context, 'content', {});
  const params = request.params || {};
  const { strain } = params;
  const { sections } = cont;

  if (!strain || !sections) {
    return;
  }

  const selected = pick(testgroups(sections), strain);
  each(sections, (section) => {
    if (!section.meta || !section.meta.test) {
      return;
    }

    section.meta.hidden = !(section === selected[section.meta.test]);
  });
}

module.exports = {
  selectstrain,
  testgroups,
  selecttest,
  pick,
};
