import React, {useCallback} from "react";
import {FormattedMessage} from "react-intl";
import {Link} from "react-router-dom";
import {Navbar, Nav, NavDropdown, Container,} from "react-bootstrap";
import "./CustomNavbar.css";

export default function CustomNavbar() {
    // Handle language change
    const handleSelect = useCallback((eventKey) => {
        let locale = "de";
        switch (eventKey) {
            case "de":
                locale = "de";
                break;
            case "en":
                locale = "en";
                break;
            default:
                locale = "de";
        }
        window.localStorage.setItem("locale", locale);
        window.location.reload();
    }, []);

    return (<Navbar
        collapseOnSelect
        expand="md"
        sticky="top"
        className="custom-navbar">
        <Container>
            {/* Brand */}
            <Navbar.Brand as={Link} to="/">
                CookieCaster 3.0
            </Navbar.Brand>

            {/* Mobile Toggle */}
            <Navbar.Toggle aria-controls="responsive-navbar-nav"/>

            {/* Nav Links */}
            <Navbar.Collapse id="responsive-navbar-nav">
                <Nav className="ms-auto">
                    <Nav.Link as={Link} to="/">
                        Home
                    </Nav.Link>

                    <Nav.Link as={Link} to="/start">
                        <FormattedMessage id="customNavbar.draw" defaultMessage="Draw" />
                    </Nav.Link>

                    <Nav.Link as={Link} to="/gallery">
                        <FormattedMessage id="customNavbar.gallery" defaultMessage="Gallery"/>
                    </Nav.Link>

                    {/* Language Dropdown */}
                    <NavDropdown
                        title={<span><i className="fa-solid fa-globe"></i></span>}
                        id="basic-nav-dropdown"
                        align="end"
                        onSelect={handleSelect}>
                        <NavDropdown.Item eventKey="de">Deutsch</NavDropdown.Item>
                        <NavDropdown.Item eventKey="en">English</NavDropdown.Item>
                    </NavDropdown>

                    <Nav.Link as={Link} to="/ueber">
                        <i className="fa-solid fa-question"></i>
                    </Nav.Link>

                    <Nav.Link as={Link} to="/about">
                        <FormattedMessage id="customNavbar.about" defaultMessage="About"/>
                    </Nav.Link>
                </Nav>
            </Navbar.Collapse>
        </Container>
    </Navbar>);
}