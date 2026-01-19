import React, {useEffect, useState} from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";
import { Container, Row, Col, Image, Button } from "react-bootstrap";
import "./Home.css";

//const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

export default function Home() {
    // Track window width
    const [width, setWidth] = useState(window.innerWidth);

    // Update on resize
    useEffect(() => {
        function handleWindowSizeChange() {
            setWidth(window.innerWidth);
        }

        window.addEventListener("resize", handleWindowSizeChange);
        return () => window.removeEventListener("resize", handleWindowSizeChange);
    }, []);

    // Device detection (mobile vs tablet/desktop)
    const isMobile = width <= 768;

    if (isMobile) {
        return (
            <Container className="mt-5">
                <div className="p-5 mb-4 bg-light rounded-3">
                    <Row>
                        <Col xs={12} sm={8} className="main-section">
                            <h2>
                                <FormattedMessage id="home.device" defaultMessage="Please use a tablet or desktop device." />
                            </h2>
                        </Col>
                    </Row>
                </div>
            </Container>
        );
    }

    // Default layout for desktop/tablet
    return (
        <Container className="mt-5 home-page">
            <div className="p-5 mb-4 bg-light rounded-3">
                <Row>
                    <Col xs={12} sm={8} className="main-section">
                        <h2>
                            <FormattedMessage id="home.welcome" defaultMessage="Welcome to CookieCaster!" />
                        </h2>
                        <p>
                            <FormattedMessage id="home.start" defaultMessage="Get started by designing your cookie cutter." />
                        </p>
                        <Link to="/start">
                            <Button size="lg" variant="primary">
                                <FormattedMessage id="home.startButton" defaultMessage="Start Drawing" />
                            </Button>
                        </Link>
                    </Col>

                    <Col xs={12} sm={4} className="main-section text-center">
                        <Image
                            id="titelbild"
                            src={`${import.meta.env.BASE_URL}assets/Pfote.png`}
                            fluid
                            alt="CookieCaster Paw Logo"
                        />
                    </Col>
                </Row>

                <Row className="mt-4">
                    <Col xs={12} sm={8} className="main-section">
                        <p>
                            <FormattedMessage id="home.needHelp" defaultMessage="Need help? Check the Imprint or FAQ section." />
                        </p>
                    </Col>
                </Row>
            </div>
        </Container>
    );
}