import { PageBreadcrumb } from '@/components'
import { useEffect, useState } from 'react'
import {
    Button,
    Card,
    Form,
    Table,
    Col,
    Row,
} from 'react-bootstrap'
import Select from 'react-select'
import { BsCalendarCheck, BsClock } from 'react-icons/bs'
import { useAuthContext } from '@/common'
import Swal from 'sweetalert2'
const ServiceSchedule = () => {
    const [selectedService, setSelectedService] = useState<string | null>(null)
    const [selectedLocations, setSelectedLocations] = useState<any[]>([])
    const [isAllLocationsSelected, setIsAllLocationsSelected] = useState(false)
    const [locationOptions, setLocationOptions] = useState<Array<{ value: string, label: string }>>([])
    const [serviceOptions, setServiceOptions] = useState<Array<{ value: string, label: string }>>([])

    const [existingScheduleId, setExistingScheduleId] = useState<string | null>(null)

    const BASE_API = import.meta.env.VITE_BASE_API
    const { user } = useAuthContext()
    const { token } = user

    const [scheduleData, setScheduleData] = useState([
        { day: 'Monday', checked: false, startTime: '', endTime: '' },
        { day: 'Tuesday', checked: false, startTime: '', endTime: '' },
        { day: 'Wednesday', checked: false, startTime: '', endTime: '' },
        { day: 'Thursday', checked: false, startTime: '', endTime: '' },
        { day: 'Friday', checked: false, startTime: '', endTime: '' },
        { day: 'Saturday', checked: false, startTime: '', endTime: '' },
        { day: 'Sunday', checked: false, startTime: '', endTime: '' },
    ])

    const handleCheckDay = (index: number) => {
        const newData = [...scheduleData]
        newData[index].checked = !newData[index].checked
        setScheduleData(newData)
    }
    // Mock function to fetch locations - replace with actual API call
    const getLocations = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/locations`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch locations')
            }

            const data = await response.json()
            const options = data.map((location: any) => ({
                value: location._id,
                label: location.name
            }))
            setLocationOptions(options)
        } catch (error) {
            console.error('Error fetching locations:', error)
        }
    }

    const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
        const newData = [...scheduleData]
        newData[index][field] = value
        setScheduleData(newData)
    }

    const fetchSchedules = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/schedules`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch schedules')
            }

            const data = await response.json()
            console.log('Fetched schedules:', data)
        } catch (error) {
            console.error('Error fetching schedules:', error)
        }
    }
    const fetchSchedulesByQuery = async (serviceType: string, locations: string[]) => {
        try {
            const locationQuery = locations.join(',')
            // Change serviceType to service in the query parameter
            const response = await fetch(
                `${BASE_API}/api/schedules?service=${serviceType}&locations=${locationQuery}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                throw new Error('Failed to fetch schedules')
            }

            const data = await response.json()

            // Reset schedule data if no data found
            if (!data || !Array.isArray(data) || data.length === 0) {
                setExistingScheduleId(null)
                setScheduleData([
                    { day: 'Monday', checked: false, startTime: '', endTime: '' },
                    { day: 'Tuesday', checked: false, startTime: '', endTime: '' },
                    { day: 'Wednesday', checked: false, startTime: '', endTime: '' },
                    { day: 'Thursday', checked: false, startTime: '', endTime: '' },
                    { day: 'Friday', checked: false, startTime: '', endTime: '' },
                    { day: 'Saturday', checked: false, startTime: '', endTime: '' },
                    { day: 'Sunday', checked: false, startTime: '', endTime: '' },
                ])
                return
            }

            const schedule = data[0]
            // Verify if the schedule belongs to the selected service
            if (schedule.service._id === serviceType) {
                setExistingScheduleId(schedule._id)
                const updatedScheduleData = scheduleData.map(item => {
                    const matchingDay = schedule.weekDays.find((day: any) => day.day === item.day)
                    return {
                        day: item.day,
                        checked: matchingDay ? matchingDay.isActive : false,
                        startTime: matchingDay ? (matchingDay.startTime || '') : '',
                        endTime: matchingDay ? (matchingDay.endTime || '') : ''
                    }
                })
                setScheduleData(updatedScheduleData)
            } else {
                // Reset if the schedule doesn't match the selected service
                setExistingScheduleId(null)
                setScheduleData([
                    { day: 'Monday', checked: false, startTime: '', endTime: '' },
                    { day: 'Tuesday', checked: false, startTime: '', endTime: '' },
                    { day: 'Wednesday', checked: false, startTime: '', endTime: '' },
                    { day: 'Thursday', checked: false, startTime: '', endTime: '' },
                    { day: 'Friday', checked: false, startTime: '', endTime: '' },
                    { day: 'Saturday', checked: false, startTime: '', endTime: '' },
                    { day: 'Sunday', checked: false, startTime: '', endTime: '' },
                ])
            }
        } catch (error) {
            console.error('Error fetching schedules:', error)
        }
    }

    const handleSubmitSchedule = async () => {
        // Prepare locations array
        const locations = isAllLocationsSelected
            ? locationOptions.map(loc => loc.value)
            : selectedLocations.map(loc => loc.value)

        // Prepare weekDays array from scheduleData
        const weekDays = scheduleData.map(schedule => ({
            day: schedule.day,
            startTime: schedule.checked ? schedule.startTime || null : null,
            endTime: schedule.checked ? schedule.endTime || null : null,
            isActive: schedule.checked
        }))

        const schedulePayload = {
            locations: locations,
            service: selectedService,
            weekDays: weekDays
        }

        console.log('Schedule Payload:', schedulePayload)
        try {
            const response = await fetch(`${BASE_API}/api/schedules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(schedulePayload)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to save schedule')
            }
            const data = await response.json()
            setExistingScheduleId(data.savedSchedule._id)
            Swal.fire({
                title: 'Success!',
                text: 'Schedule saved successfully',
                icon: 'success',
                timer: 1500,
            })

        } catch (error: any) {
            Swal.fire({
                title: 'Error!',
                text: error.message || 'Something went wrong while saving schedule',
                icon: 'error',
                // timer: 1500,
            })
        }
    }
    const handleUpdateSchedule = async () => {
        if (!existingScheduleId) return

        const locations = isAllLocationsSelected
            ? locationOptions.map(loc => loc.value)
            : selectedLocations.map(loc => loc.value)

        const weekDays = scheduleData.map(schedule => ({
            day: schedule.day,
            startTime: schedule.checked ? schedule.startTime || null : null,
            endTime: schedule.checked ? schedule.endTime || null : null,
            isActive: schedule.checked
        }))

        const schedulePayload = {
            locations: locations,
            serviceType: selectedService,
            weekDays: weekDays
        }

        try {
            const response = await fetch(`${BASE_API}/api/schedules/${existingScheduleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(schedulePayload)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to update schedule')
            }

            Swal.fire({
                title: 'Success!',
                text: 'Schedule updated successfully',
                icon: 'success',
                timer: 1500,
            })

        } catch (error: any) {
            Swal.fire({
                title: 'Error!',
                text: error.message || 'Something went wrong while updating schedule',
                icon: 'error',
            })
        }
    }

    const handleServiceChange = (selected: any) => {
        setSelectedService(selected?.value || null)
        resetScheduleData()
    }
    const resetScheduleData = () => {
        const emptySchedule = [
            { day: 'Monday', checked: false, startTime: '', endTime: '' },
            { day: 'Tuesday', checked: false, startTime: '', endTime: '' },
            { day: 'Wednesday', checked: false, startTime: '', endTime: '' },
            { day: 'Thursday', checked: false, startTime: '', endTime: '' },
            { day: 'Friday', checked: false, startTime: '', endTime: '' },
            { day: 'Saturday', checked: false, startTime: '', endTime: '' },
            { day: 'Sunday', checked: false, startTime: '', endTime: '' },
        ]
        setScheduleData(emptySchedule)
        setExistingScheduleId(null)
    }
    const renderEmptyState = () => {
        return (
            <div
                className="d-flex flex-column align-items-center justify-content-center"
                style={{ minHeight: '300px', padding: '2rem' }}
            >
                <BsCalendarCheck size={64} className="text-muted mb-3" />
                <h4 className="text-muted">Welcome to Service Scheduler!</h4>
                <p className="text-center text-muted mb-0">
                    Please select a service & branch from the dropdown above to view and manage its schedule.
                </p>
            </div>
        )
    }

    const handleAllLocationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsAllLocationsSelected(e.target.checked)
        if (e.target.checked) {
            setSelectedLocations(locationOptions)
        } else {
            setSelectedLocations([])
        }
    }
    const renderGroomingScheduleTable = () => {
        return (
            <div className="table-responsive-sm">
                <Table className="table-centered mb-0">
                    <thead>
                        <tr>
                            <th>
                                <Form.Check
                                    type="checkbox"
                                    onChange={(e) => {
                                        const newData = scheduleData.map(item => ({
                                            ...item,
                                            checked: e.target.checked
                                        }))
                                        setScheduleData(newData)
                                    }}
                                    checked={scheduleData.every(item => item.checked)}
                                />
                            </th>
                            <th>Days</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scheduleData.map((schedule, index) => (
                            <tr key={schedule.day}>
                                <td>
                                    <Form.Check
                                        type="checkbox"
                                        checked={schedule.checked}
                                        onChange={() => handleCheckDay(index)}
                                    />
                                </td>
                                <td>{schedule.day}</td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <Form.Control
                                            type="time"
                                            value={schedule.startTime}
                                            onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                                            style={{ width: '130px' }}
                                        />
                                        <BsClock className="ms-2" />
                                    </div>
                                </td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <Form.Control
                                            type="time"
                                            value={schedule.endTime}
                                            onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                                            style={{ width: '130px' }}
                                        />
                                        <BsClock className="ms-2" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        )
    }
    const renderDaycareScheduleTable = () => {
        return (
            <div className="table-responsive-sm">
                <Table className="table-centered mb-0">
                    <thead>
                        <tr>
                            <th>
                                <Form.Check
                                    type="checkbox"
                                    onChange={(e) => {
                                        const newData = scheduleData.map(item => ({
                                            ...item,
                                            checked: e.target.checked
                                        }))
                                        setScheduleData(newData)
                                    }}
                                    checked={scheduleData.every(item => item.checked)}
                                />
                            </th>
                            <th>Days</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scheduleData.map((schedule, index) => (
                            <tr key={schedule.day}>
                                <td>
                                    <Form.Check
                                        type="checkbox"
                                        checked={schedule.checked}
                                        onChange={() => handleCheckDay(index)}
                                    />
                                </td>
                                <td>{schedule.day}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        )
    }
    const getServices = async () => {
        try {
            const response = await fetch(`${BASE_API}/api/services`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch services')
            }

            const data = await response.json()
            const options = data.map((service: any) => ({
                value: service._id,
                label: service.name
            }))
            setServiceOptions(options)
        } catch (error) {
            console.error('Error fetching services:', error)
        }
    }

    const renderServiceContent = () => {
        if (!selectedService || (!isAllLocationsSelected && selectedLocations.length === 0)) {
            return renderEmptyState()
        }

        const locationNames = selectedLocations.map(loc => loc.label).join(', ')
        const locationText = isAllLocationsSelected
            ? 'all locations'
            : locationNames || 'no location selected'

        const selectedServiceData = serviceOptions.find(s => s.value === selectedService)

        // For Grooming Service
        if (selectedServiceData?.value === '674edf5f1397cde5a452ac4d') {
            return (
                <div className="mt-4">
                    <h5>Welcome to Grooming Service Schedule</h5>
                    <p>Currently showing schedule for {locationText}</p>
                    {renderGroomingScheduleTable()}
                    <div className="mt-3 text-end">
                        <Button
                            variant="success"
                            onClick={existingScheduleId ? handleUpdateSchedule : handleSubmitSchedule}
                        >
                            {existingScheduleId ? 'Update Schedule' : 'Save Schedule'}
                        </Button>
                    </div>
                </div>
            )
        }

        // For Day Care Service
        if (selectedServiceData?.value === '674edf6d1397cde5a452ac50') {
            return (
                <div className="mt-4">
                    <h5>Welcome to Daycare Service Schedule</h5>
                    <p>Currently showing schedule for {locationText}</p>
                    {renderDaycareScheduleTable()}
                    <div className="mt-3 text-end">
                        <Button
                            variant="success"
                            onClick={existingScheduleId ? handleUpdateSchedule : handleSubmitSchedule}
                        >
                            {existingScheduleId ? 'Update Schedule' : 'Save Schedule'}
                        </Button>
                    </div>
                </div>
            )
        }

        // For Vet and Boarding Services (Coming Soon)
        return (
            <div className="mt-4 text-center py-5">
                <h4>This service will be coming soon!</h4>
                <p className="text-muted">We're working hard to bring you this service.</p>
            </div>
        )
    }

    useEffect(() => {
        getServices()
        getLocations()
        fetchSchedules()
    }, [])



    useEffect(() => {
        resetScheduleData()
        if (selectedService && (selectedLocations.length > 0 || isAllLocationsSelected)) {
            const locations = isAllLocationsSelected
                ? locationOptions.map(loc => loc.value)
                : selectedLocations.map(loc => loc.value)

            fetchSchedulesByQuery(selectedService, locations)
        }
    }, [selectedService, selectedLocations, isAllLocationsSelected])


    return (
        <>
            <PageBreadcrumb title="Service Scheduler" subName="Services" />
            <Card>
                <Card.Header>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center">
                        <div>
                            <h4 className="header-title">Service Scheduler</h4>
                            <p className="text-muted mb-0">
                                Add and Manage your all service scheduler here.
                            </p>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Select Service</Form.Label>
                                <Select
                                    options={serviceOptions}
                                    className="react-select"
                                    classNamePrefix="react-select"
                                    placeholder="Choose service..."
                                    isClearable
                                    onChange={handleServiceChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <div className="d-flex justify-content-between align-items-center ">
                                    <Form.Label>Select Branch Locations</Form.Label>
                                    <Form.Check
                                        type="checkbox"
                                        label="All Branch Locations"
                                        checked={isAllLocationsSelected}
                                        onChange={handleAllLocationsChange}
                                    />
                                </div>
                                <Select
                                    isMulti
                                    options={locationOptions}
                                    value={selectedLocations}
                                    className="react-select"
                                    classNamePrefix="react-select"
                                    placeholder="Select locations..."
                                    isDisabled={isAllLocationsSelected}
                                    onChange={(selected) => setSelectedLocations(selected ? [...selected] : [])}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {renderServiceContent()}
                </Card.Body>
            </Card>
        </>
    )
}

export default ServiceSchedule