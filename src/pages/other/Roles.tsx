import { Card, Col, Row, Button, Table, Form } from 'react-bootstrap';
import { useState } from 'react';
import { FormInput, PageBreadcrumb } from '@/components';
import { useAuthContext } from '@/common';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import { SmallLoader } from './SimpleLoader';

const menuPermissions: any = {
    "Dashboard": "Dashboard",
    "Products": "Products",
    "Inventory": "Inventory",
    "Orders": "Orders",
    "Users": "Users",
    "Notifications": "Notifications",
    "Wallets": "Wallets",
    "University": "University",
    "Settings": "Settings",
    "Policies": "Policies",
};

const additionalPermissions: any = {
    "Home": "Home",
    "Valliani University": "Valliani University",
    "Inventory": "Inventory Order",
    "Marketing": "Marketing",
    "Supplies": "Supplies",
    "Tool Finding": "Tool Finding",
    "GWP": "GWP",
    "Add to Cart": "Cart"
};

const Roles = () => {
    const defaultPermission: any = Object.keys(menuPermissions).reduce((acc: any, key: any) => {
        acc[menuPermissions[key]] = { Create: false, View: false, Update: false, Delete: false };
        return acc;
    }, {});

    Object.keys(additionalPermissions).forEach(key => {
        defaultPermission[additionalPermissions[key]] = { View: false };
    });

    const [permission, setPermission] = useState<any>(defaultPermission);
    const { user } = useAuthContext();
    const [error, setError] = useState('');
    const [role, setRole] = useState('');
    const [apiLoading, setApiLoading] = useState(false);

    const resetForm = () => {
        setPermission(defaultPermission);
        setRole('');
    };

    const handlePermissionToggle = (menuKey: any, permType: any) => {
        setPermission((prev: any) => ({
            ...prev,
            [menuKey]: {
                ...prev[menuKey],
                [permType]: !prev[menuKey][permType]
            }
        }));
    };

    const handleSubmit = async () => {
        if (!role) {
            setError('Please Enter a Role Name.');
            return;
        }
        setError('');
        setApiLoading(true);

        const roleData = {
            role_name: role,
            permissions: permission,
        };
        console.log(roleData);

        try {
            const token = user.token;
            const BASE_API = import.meta.env.VITE_BASE_API;
            const response = await fetch(`${BASE_API}/api/users/role`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(roleData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            await response.json();
            Swal.fire({
                title: 'Role Created Successfully!',
                text: 'Role with permission has been created successfully!',
                icon: 'success',
                timer: 1500,
                confirmButtonColor: "#9c5100",
            });
            resetForm();
        } catch (error) {
            Swal.fire({
                title: 'Error!',
                text: `This Role is already taken. Please choose another one.`,
                icon: 'error',
                timer: 1500,
            });
        } finally {
            setApiLoading(false);
        }
    };

    return (
        <div>
            <PageBreadcrumb title="Create New Role" subName="User" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">{`Role & Permission`}</h4>
                        </div>
                        <div className="mt-3 mt-lg-0">
                            <Button
                                style={{ border: 'none' }}
                                variant="none">
                                <Link to="/user/role-all" className="btn btn-danger">
                                    See All Roles
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col lg={6} className="mb-3">
                            <FormInput
                                label="Role"
                                type="text"
                                name="role_name"
                                placeholder="Enter Role Name"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            />
                            {error && <small className="text-danger">{error}</small>}
                        </Col>
                    </Row>
                    <Table className="table-hover table-centered mb-0">
                        <thead>
                            <tr>
                                <th>Menu</th>
                                <th>Create</th>
                                <th>View</th>
                                <th>Update</th>
                                <th>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(menuPermissions).map(([name, key]) => (
                                <tr key={key as string}>
                                    <td>{name}</td>
                                    {Object.keys(defaultPermission[key as string]).map((perm) => (
                                        <td key={perm}>
                                            <Form.Check
                                                type="checkbox"
                                                checked={permission[key as string][perm]}
                                                onChange={() => handlePermissionToggle(key as string, perm)}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <h5 className="mt-4">Additional Permissions</h5>
                    <Table className="table-hover table-centered mb-0">
                        <thead>
                            <tr>
                                <th>Menu</th>
                                <th>View</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(additionalPermissions).map(([name, key]) => (
                                <tr key={key as string}>
                                    <td>{name}</td>
                                    <td>
                                        <div className="toggle-container" style={{ marginRight: '10px' }}>
                                            <label className="toggle">
                                                <input
                                                    type="checkbox"
                                                    id={`toggle-${key as string}`}
                                                    checked={permission[key as string].View}
                                                    onChange={() => handlePermissionToggle(key as string, 'View')}
                                                />
                                                <span className="slider"></span>
                                                <span className="text on">ON</span>
                                                <span className="text off">OFF</span>
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Button
                        className="mt-3"
                        variant="success"
                        onClick={handleSubmit}
                        disabled={apiLoading}
                    >
                        {apiLoading ? <SmallLoader /> : `Save Role & Permission`}
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Roles;