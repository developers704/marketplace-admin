import React from 'react'
import { SERVICES_CATEGORIES } from '@/constants/menu'
import { Card, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { PageBreadcrumb } from '@/components'

const ServiceCategories: React.FC = () => {
    const navigate = useNavigate()

    const handleSettingClick = (url: string) => {
        navigate(url)
    }

    return (
        <>
            <PageBreadcrumb title="Special Categories" subName="Special" />

            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="header-title mb-0">Special Categories Management</h4>
                        <p className="text-muted mb-0">Manage all special categories management related configurations</p>
                    </div>
                </Card.Header>

                <Card.Body>
                    <Row>
                        {SERVICES_CATEGORIES?.map((setting: any) => (
                            <Col md={4} key={setting.key}>
                                <Card
                                    onClick={() => handleSettingClick(setting.url!)}
                                    className="setting-card hover-shadow"
                                    style={{
                                        cursor: 'pointer',
                                        margin: '10px',
                                        transition: 'all 0.3s ease',
                                        backgroundColor: '#f8f9fa'
                                    }}
                                >
                                    <Card.Body>
                                        <div className="d-flex align-items-center mb-3">
                                            {setting.icon && React.createElement(setting.icon, {
                                                size: 24,
                                                className: 'text-primary me-2'
                                            })}
                                            <Card.Title className="mb-0">{setting.label}</Card.Title>
                                        </div>
                                        <Card.Text className="text-muted">
                                            Manage {setting.label.toLowerCase()} settings and configurations
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Card.Body>
            </Card>

            <style>
                {`
                    .setting-card:hover {
                        transform: translateY(-3px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        background-color: #ffffff !important;
                    }
                    .hover-shadow {
                        border: 1px solid #e5e9f2;
                    }
                `}
            </style>
        </>
    )
}

export default ServiceCategories
