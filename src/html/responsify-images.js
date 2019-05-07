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

const RESOLUTION_SWITCHING = [
  {
    width: 480,
    maxWidth: 480,
    size: 95,
  },
  {
    width: 799,
    maxWidth: 799,
    size: 95,
  },
  {
    width: 1024,
    maxWidth: null,
    size: 97,
  },
];

/* Parameter Reassignment is the standard design pattern for Unified */

function transformer(
  { content: { htast } },
  {
    RESOLUTIONS = RESOLUTION_SWITCHING,
    logger,
  },
) {
  logger.debug(`Making images responsive in ${typeof htast}`);

  function visit(node) {
    if (node.type === 'element' && node.tagName === 'img') {
      const src = String(node.properties.src);

      logger.debug(`Making image ${src} responsive`);

      node.properties.src = `${src}?width=320`;

      const srcset = [];
      const sizes = [];

      RESOLUTIONS.forEach((e) => {
        srcset.push(`${src}?width=${e.width} ${e.width}w`);
        sizes.push(`${(e.maxWidth ? `(max-width: ${e.maxWidth}px) ` : '') + e.size}vw`);
      });

      node.properties.srcset = srcset.join(', ');
      node.properties.sizes = sizes.join(', ');
    }

    if (node.children) {
      node.children.forEach((e) => {
        visit(e);
      });
    }
  }

  // the visit function is modifying its argument in place.
  visit(htast);
}

module.exports = transformer;
