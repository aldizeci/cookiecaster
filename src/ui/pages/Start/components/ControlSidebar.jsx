import React from "react";
import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { Col } from "react-bootstrap";
import SidebarButtonWithTooltip from "./SidebarButtonWithTooltip";

export default function ControlSidebar() {
    return (
        <aside className="sidenav">

            <h5><FormattedMessage id="start.controlSidebarTitle" /></h5>
            <Link id="load" className="nav-link" to="/gallery">
                <i className="fas fa-upload"></i> <FormattedMessage id="start.loadFromGallery"/>
            </Link>

            <SidebarButtonWithTooltip id="save" msgId="start.save">
                <i className="far fa-save"></i> <FormattedMessage id="start.save" />
            </SidebarButtonWithTooltip>

            <SidebarButtonWithTooltip id="exportToFile" msgId="start.exportAsFile">
                <i className="fas fa-file-export"></i> <FormattedMessage id="start.exportAsFile" />
            </SidebarButtonWithTooltip>

            <SidebarButtonWithTooltip id="analyze" msgId="start.analyzeText">
                <i className="fab fa-searchengin"></i> <FormattedMessage id="start.analyze" />
            </SidebarButtonWithTooltip>

            <Link id="goToExport" className="nav-link" to="/export">
                <i className="fas fa-download"></i> <FormattedMessage id="start.export" />
            </Link>
        </aside>
    );
}