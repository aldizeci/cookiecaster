import { Offcanvas } from "react-bootstrap";
import {FormattedMessage} from "react-intl";
import DrawerItem from "./DrawerItem";


export default function Drawer( {showDrawer, setShowSidebar, position, onAnalyze, onSave, onLoadFromFile, onExportToFile }){
    return (
            <div>
                <Offcanvas
                    show={showDrawer}
                    onHide={() => setShowSidebar(false)}
                    placement={ position }
                    className="control-drawer"
                    >
                    <Offcanvas.Header closeButton>
                        <Offcanvas.Title>
                            <FormattedMessage id="start.controlSidebarTitle"/>
                        </Offcanvas.Title>
                    </Offcanvas.Header>

                    <Offcanvas.Body>
                        <DrawerItem onButtonClick={onAnalyze}>
                            <i className="fab fa-searchengin me-2"></i>
                            <FormattedMessage id="start.analyze" defaultMessage="Analyze" />
                        </DrawerItem>
                        <DrawerItem closeDrawer={setShowSidebar} to="/gallery" >
                            <i className="fas fa-upload"></i>
                            <FormattedMessage id="start.loadFromGallery"/>
                        </DrawerItem>
                        <DrawerItem onButtonClick={onSave}>
                            <i className="far fa-save"></i> <FormattedMessage id="start.save"/>
                        </DrawerItem>
                        <DrawerItem onButtonClick={onExportToFile}>
                            <i className="fas fa-file-export"></i> <FormattedMessage id="start.exportAsFile"/>
                        </DrawerItem>
                        <DrawerItem closeDrawer={setShowSidebar} to="/export" >
                            <i className="fas fa-download"></i> <FormattedMessage id="start.export"/>
                        </DrawerItem>
                    </Offcanvas.Body>
                </Offcanvas>
            </div>
            
    )

}
