import React, { useState } from 'react';
import './ProductSelection.css';

const ProductSelection = ({ domains, subDomains, onDomainSelect, onSubDomainSelect, selectedDomain, onBack }) => {
  const [hoveredDomain, setHoveredDomain] = useState(null);

  if (selectedDomain) {
    // Show subdomain selection
    const subDomainList = subDomains[selectedDomain.id] || [];

    return (
      <div className="product-selection-overlay">
        <div className="product-selection-container">
          <button className="back-button" onClick={onBack}>
            ← Back to domains
          </button>

          <div className="selection-header">
            <h2>What specifically in {selectedDomain.name}?</h2>
            <p>Pick the area you want to focus on</p>
          </div>

          <div className="subdomain-grid">
            {subDomainList.map((subDomain, index) => (
              <button
                key={index}
                className="subdomain-card"
                onClick={() => onSubDomainSelect(subDomain)}
              >
                <span className="subdomain-text">{subDomain}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show domain selection
  return (
    <div className="product-selection-overlay">
      <div className="product-selection-container">
        <div className="selection-header">
          <h2>Pick your domain</h2>
          <p>Select the area where you need AI tools</p>
        </div>

        <div className="domain-grid">
          {domains.map((domain) => (
            <button
              key={domain.id}
              className={`domain-card ${hoveredDomain === domain.id ? 'hovered' : ''}`}
              onClick={() => onDomainSelect(domain)}
              onMouseEnter={() => setHoveredDomain(domain.id)}
              onMouseLeave={() => setHoveredDomain(null)}
            >
              <span className="domain-card-name">{domain.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductSelection;
