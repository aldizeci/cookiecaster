import React from "react";
import {Link} from "react-router-dom";
import {FormattedMessage} from "react-intl";
import SidebarButtonWithTooltip from "./SidebarButtonWithTooltip";

export default function ControlSidebar() {
    return (
        <aside className="sidenav">
            <h5><FormattedMessage id="start.controlSidebarTitle"/></h5>

            <SidebarButtonWithTooltip id="analyze" msgId="start.analyzeText">
                <i className="fab fa-searchengin"></i> <FormattedMessage id="start.analyze"/>
            </SidebarButtonWithTooltip>

            <SidebarButtonWithTooltip id="save" msgId="start.save">
                <i className="far fa-save"></i> <FormattedMessage id="start.save"/>
            </SidebarButtonWithTooltip>

            {/* Links cannot have tooltips easily via wrapper => left as plain */}
            <Link id="load" className="nav-link" to="/gallery">
                <i className="fas fa-upload"></i>{" "}
                <FormattedMessage id="start.loadFromGallery"/>
            </Link>

            <SidebarButtonWithTooltip id="loadFromFile" msgId="start.loadFromFile">
                <i className="fas fa-folder-open"></i> <FormattedMessage id="start.loadFromFile"/>
            </SidebarButtonWithTooltip>

            <SidebarButtonWithTooltip id="exportToFile" msgId="start.exportToFile">
                <i className="fas fa-file-export"></i> <FormattedMessage id="start.exportAsFile"/>
            </SidebarButtonWithTooltip>

            <Link id="goToExport" className="nav-link" to="/export">
                <i className="fas fa-download"></i> <FormattedMessage id="start.export"/>
            </Link>
        </aside>
    );
}