"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const schema_typescript_1 = require("schema-typescript");
const graph_schema_json_1 = __importDefault(require("../graph.schema.json"));
const code = (0, schema_typescript_1.generateTypeScript)(graph_schema_json_1.default, {
    exclude: ['GraphSchemata']
});
(0, fs_1.writeFileSync)(__dirname + '/../src/types.ts', code);
