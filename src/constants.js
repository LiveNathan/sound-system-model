import {gsap} from "gsap";

export const AUDIENCE_LOCATION_Z_IF_SEATED_METERS = 1.26;
export const AUDIENCE_LOCATION_Z_IF_SEATED_OTHER = 1.623;
export const AUDIENCE_LOCATION_Z_NOT_SEATED_METERS = 4.13;
export const AUDIENCE_LOCATION_Z_NOT_SEATED_OTHER = 5.32;
export const AUDIENCE_DIMENSION_WIDTH_FACTOR = 4;
export const MAIN_COLOR = 0xff0000;
export const SUB_COLOR = 0x0000ff;
export const AUDIENCE_COLOR = 0x00ff00;
export const LABEL_OFFSET = 15;
export const DEFAULT_LABEL_CLASS = 'text-base p-1 m-1';
export const X_LABEL_CLASS = 'text-red-600';
export const Y_LABEL_CLASS = 'text-axes-green';
export const Z_LABEL_CLASS = 'text-blue-600';
export const timeline = gsap.timeline({defaults: {duration: 1}});
export const orientation = {
    TOP: "TOP",
    SIDE: "SIDE",
    FRONT: "FRONT"
};