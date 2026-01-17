import { Button } from "react-bootstrap";
import {Link} from "react-router-dom";



export default function DrawerItem( {children, onButtonClick, to, closeDrawer }){
    if (to) {
        return (
            <div>
                <Button
                        as={ Link }
                        to={ to }
                        variant="primary"
                        className="drawer-item"
                        onClick={() => closeDrawer(false)}
                    >
                        { children }
                </Button>
            </div>)
    }

    return (
            <div>
                <Button
                    className="drawer-item"
                    variant="primary"
                    onClick={() => onButtonClick()}
                    >
                        { children }
                </Button>
            </div>)

}