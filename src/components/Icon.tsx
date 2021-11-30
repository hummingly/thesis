import { IconSprite } from "../../assets/icons/definition";
import ICON_SPRITE from "../../assets/icons/icon-sprite.svg";

export const Icon = (props: { source: IconSprite }) => {
    return (
        <svg focusable="false" aria-hidden="true" width="20" height="20">
            <use href={`${ICON_SPRITE}#${props.source}`} />
        </svg>
    );
};
