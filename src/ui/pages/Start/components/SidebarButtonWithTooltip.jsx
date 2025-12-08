import React from "react";
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import {FormattedMessage} from "react-intl";

export default function SidebarButtonWithTooltip({id, msgId, children, placement = "right", ...props}) {
    return (
        <OverlayTrigger
            placement={placement}
            overlay={
                <Tooltip id={`tooltip-${id}`}>
                    <FormattedMessage id={msgId}/>
                </Tooltip>
            }
        >
            <button id={id} {...props}> {children} </button>
        </OverlayTrigger>
    );
}
