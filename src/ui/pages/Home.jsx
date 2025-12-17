import React, { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";
import { Container, Row, Col, Image, Button } from "react-bootstrap";


export default function Home() {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const isMobile = width <= 768;

    // MOBILE VERSION
    if (isMobile) {
        return (
            <Container className="mt-5">
                <div className="p-5 bg-light rounded text-center">
                    <h2>
                        <FormattedMessage
                            id="home.device"
                            defaultMessage="Please use a tablet or desktop device."
                        />
                    </h2>
                </div>
            </Container>
        );
    }

    // DESKTOP/TABLET VERSION
    return (
        <Container className="mt-5">
            <div className="p-5 bg-light rounded">
                {/* Welcome section */}
                <Row className="align-items-center">
                    <Col md={8} className="mb-4 mb-md-0">
                        <h2>
                            <FormattedMessage
                                id="home.welcome"
                                defaultMessage="Welcome to CookieCaster!"
                            />
                        </h2>

                        <p>
                            <FormattedMessage
                                id="home.start"
                                defaultMessage="Get started by designing your cookie cutter."
                            />
                        </p>
                        <Button as={Link} to="/start" size="lg" variant="primary">
                                <FormattedMessage
                                    id="home.startButton"
                                    defaultMessage="Start Drawing"
                                />
                        </Button>

                        {/* <Link to="/start">
                            <Button variant="primary" size="lg">
                                <FormattedMessage
                                    id="home.startButton"
                                    defaultMessage="Start Drawing"
                                />
                            </Button>
                        </Link> */}
                    </Col>

                    {/* Right image */}
                    <Col md={4} className="text-center">
                        <Image
                            src={`${import.meta.env.BASE_URL}assets/Pfote.png`}
                            alt="CookieCaster Paw Logo"
                            fluid
                        />
                    </Col>
                </Row>

                {/* Help text */}
                <Row className="mt-4">
                    <Col md={8}>
                        <p>
                            <FormattedMessage
                                id="home.needHelp"
                                defaultMessage="Need help? Check the About or FAQ section."
                            />
                        </p>
                    </Col>
                </Row>
            </div>
        </Container>
    );
}
