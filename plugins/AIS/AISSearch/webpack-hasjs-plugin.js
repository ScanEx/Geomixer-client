/*
 * (C) Copyright IBM Corp. 2012, 2016 All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 const BasicEvaluatedExpression = require("webpack/lib/BasicEvaluatedExpression");

module.exports = class HasJsPlguin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.plugin("compilation", (__, params) => {
//console.log(params.normalModuleFactory)
      //params.normalModuleFactory.plugin("parser", (parser) => {
        params.normalModuleFactory.parser.plugin("evaluate CallExpression", (expr) => {
          if (expr && expr.type === "CallExpression" &&
              expr.callee && expr.callee.name == "has" &&
              expr.arguments && expr.arguments.length === 1 &&
              expr.arguments[0].type === "Literal" && typeof expr.arguments[0].value === 'string') {
            const value = this.options.features[expr.arguments[0].value];
//console.log(expr)
            if (typeof value === 'undefined' && this.options.coerceUndefinedToFalse) {
              value = false;
            }
            if (typeof value !== 'undefined' && value !== null) {
              const result = new BasicEvaluatedExpression().setRange(expr.range);
              switch(typeof value) {
                case "number":
                  return result.setNumber(value);
                case "string":
                  return result.setString(value);
                case "boolean":
//console.log(value)
                  return result.setBoolean(value);
              }
            }
          }
        });
      //});
    });
  }
};
