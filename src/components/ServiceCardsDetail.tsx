import {
  Offcanvas as BootstrapOffcanvas // Add this
} from 'react-bootstrap'
interface ServiceCardDetailsProps {
  show: boolean;
  onHide: () => void;
  cardData: any;
}

const ServiceCardDetails = ({ show, onHide, cardData }: ServiceCardDetailsProps) => {
  const BASE_API = import.meta.env.VITE_BASE_API;

  return (
    <BootstrapOffcanvas show={show} onHide={onHide} placement="end" className="service-details-canvas">
      <BootstrapOffcanvas.Header closeButton className="border-bottom">
        <BootstrapOffcanvas.Title className="text-primary">
          <i className="ri-information-line me-2"></i>
          Service Details
        </BootstrapOffcanvas.Title>
      </BootstrapOffcanvas.Header>

      <BootstrapOffcanvas.Body className="px-4">
        {/* Service Image Banner */}
        {cardData?.image && (
          <div className="text-center mb-4">
            <img
              src={`${BASE_API}/${cardData?.image}`}
              alt={cardData?.name}
              className="img-fluid rounded shadow-sm"
              style={{ maxHeight: '200px', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Basic Info Card */}
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-body">
            <h4 className="card-title text-primary mb-3">{cardData?.name}</h4>
            <div className="d-flex align-items-center mb-3">
              <span className="badge bg-success fs-5 me-2">$ {cardData?.price}</span>
            </div>
            <p className="card-text text-muted">{cardData?.description}</p>
          </div>
        </div>

        {/* Categories Section */}
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-3">
              <i className="ri-list-check-2 me-2"></i>
              Service Categories
            </h5>
            <div className="row g-3">
              {/* Main Categories */}
              <div className="col-12">
                <div className="category-group">
                  <small className="text-muted d-block mb-2">Main Categories:</small>
                  <div className="d-flex flex-wrap gap-2">
                    {cardData?.serviceCategories?.map((cat: any) => (
                      <span key={cat?._id} className="badge bg-primary-subtle text-primary">
                        {cat?.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sub Categories */}
              <div className="col-12">
                <div className="category-group">
                  <small className="text-muted d-block mb-2">Sub Categories:</small>
                  <div className="d-flex flex-wrap gap-2">
                    {cardData?.serviceSubCategories?.map((sub: any) => (
                      <span key={sub?._id} className="badge bg-info-subtle text-info">
                        {sub?.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sub Sub Categories */}
              <div className="col-12">
                <div className="category-group">
                  <small className="text-muted d-block mb-2">Sub Sub Categories:</small>
                  <div className="d-flex flex-wrap gap-2">
                    {cardData?.serviceSubSubCategories?.map((subsub: any) => (
                      <span key={subsub?._id} className="badge bg-secondary-subtle text-secondary">
                        {subsub?.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="row g-4">
          {/* Locations */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3">
                  <i className="ri-map-pin-line me-2"></i>
                  Available Locations
                </h5>
                <div className="d-flex flex-wrap gap-2">
                  {cardData?.locations?.map((loc: any) => (
                    <span key={loc?._id} className="badge bg-warning-subtle text-warning">
                      <i className="ri-map-pin-fill me-1"></i>
                      {loc?.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pet Types */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3">
                  <i className="ri-service-line me-2"></i>
                  Suitable For
                </h5>
                <div className="d-flex flex-wrap gap-2">
                  {cardData?.petTypes?.map((pet: any) => (
                    <span key={pet?._id} className="badge bg-purple-subtle text-purple">
                      <i className="ri-paw-fill me-1"></i>
                      {pet?.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </BootstrapOffcanvas.Body>
    </BootstrapOffcanvas>
  );
};

export default ServiceCardDetails;