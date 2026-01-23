"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Footer = Footer;
// @ts-nocheck
const link_1 = __importDefault(require("next/link"));
const image_1 = __importDefault(require("next/image"));
const react_1 = require("@interchain-ui/react");
const cosmology_name_logo_svg_1 = __importDefault(require("../../images/cosmology-name-logo.svg"));
function Footer() {
    return (<react_1.Box gap="$6" pt="$10" display="flex" alignItems="center" justifyContent="center" borderTopWidth="1px" borderTopColor="$gray100" borderTopStyle="solid">
      <react_1.Text color="$gray500" fontSize="$xs">Built with</react_1.Text>
      <link_1.default href="https://cosmology.zone/" target="_blank">
        <image_1.default src={cosmology_name_logo_svg_1.default} alt="Cosmology Logo" width={110}/>
      </link_1.default>
    </react_1.Box>);
}
