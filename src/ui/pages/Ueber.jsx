import React from 'react';
import {FormattedMessage} from 'react-intl';
import {Container, Row, Col, Button} from 'react-bootstrap';
import {Link} from 'react-router-dom';

const Ueber = () => {
    return (
        <Container className="py-5">
            <div className="p-5 mb-4 bg-light rounded-3">
                <Row>
                    <Col xs={12} sm={8} className="main-section">

                        <h2>
                            <FormattedMessage id="ueber.title"/>
                        </h2>

                        <p>
                            <FormattedMessage id="ueber.text1"/>
                            <br/><br/>
                            <FormattedMessage id="ueber.text2"/>
                            <br/><br/>
                            <FormattedMessage id="ueber.text3"/>
                            <br/><br/><br/>
                            <FormattedMessage id="ueber.text4"/>
                        </p>

                        <video
                            controls
                            width="100%"
                            style={{borderRadius: '8px'}}
                        >
                            <source src="/cookiecaster/assets/Cookiecaster_Tutorial_2.1.mp4" type="video/mp4"/>
                            Your browser does not support the video tag.
                        </video>

                        <br/><br/>

                        <Link to="/start">
                            <Button id="zurückButton" className="btn-lg btn-primary">
                                <FormattedMessage id="export.backButton"/>
                            </Button>
                        </Link>

                    </Col>
                </Row>
            </div>
        </Container>
    );
};

export default Ueber;