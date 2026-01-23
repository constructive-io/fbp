"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = Header;
// @ts-nocheck
const link_1 = __importDefault(require("next/link"));
const image_1 = __importDefault(require("next/image"));
const react_1 = require("@interchain-ui/react");
const cosmology_name_logo_svg_1 = __importDefault(require("../../images/cosmology-name-logo.svg"));
function Header({ onMenuButtonClick = () => { }, }) {
    return (<react_1.Box pb="$8" display="flex" alignItems="center" borderBottomWidth="1px" borderBottomColor="$gray100" borderBottomStyle="solid">
      <react_1.Box flex="1">
        <link_1.default href="/">
          <image_1.default src={cosmology_name_logo_svg_1.default} alt="Interchain Logo" width={180}/>
        </link_1.default>
      </react_1.Box>
      <react_1.Box display={{ mobile: "none", desktop: "block" }}>
        <link_1.default href="/components">
          <react_1.Text fontWeight="$medium" color="$purple500">Components</react_1.Text>
        </link_1.default>
      </react_1.Box>
      <react_1.Box display={{ mobile: "block", desktop: "none" }}>
        <react_1.IconButton icon="verticalMore" variant="ghost" intent="secondary" onClick={onMenuButtonClick}/>
      </react_1.Box>
    </react_1.Box>);
}
