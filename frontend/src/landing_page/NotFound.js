import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="text-center p-5 rounded shadow-sm bg-white" style={{ maxWidth: "520px" }}>
        
        {/* Icon */}
        <div className="mb-4">
          <i className="fas fa-exclamation-triangle fa-3x text-primary"></i>
        </div>

        {/* Heading */}
        <h1 className="display-5 fw-bold mb-3">404</h1>
        <h4 className="mb-3">Page Not Found</h4>

        {/* Description */}
        <p className="text-muted mb-4">
          Sorry, the page you are looking for doesn’t exist or has been moved.
        </p>

        {/* CTA */}
        <Link to="/" className="btn btn-primary px-4">
          Go Back Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
