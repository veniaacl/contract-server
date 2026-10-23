import React, { useEffect, useState } from "react";
import "./PriceAdjustment.css";

// Maps internal keys -> human-readable labels
const CATEGORY_LABELS = {
  Applicability:  { label: "Applicability",    params: { Existence: "Existence",            Scope: "Scope" } },
  CostComponents: { label: "Cost Components",  params: { Labour: "Labour",                  Materials: "Materials",  Fuel: "Fuel" } },
  Indices:        { label: "Indices",           params: { WPI: "WPI",                        CPI: "CPI",              LabourIndex: "Labour Index" } },
  Time:           { label: "Time",              params: { BaseDate: "Base Date",             ReferenceDate: "Reference Date" } },
  Calculation:    { label: "Calculation",       params: { Formula: "Formula",                Coefficients: "Coefficients" } },
  Threshold:      { label: "Threshold",         params: { MinimumVariation: "Minimum Variation %" } },
  Cap:            { label: "Cap",               params: { MaximumAdjustment: "Maximum Adjustment Limit" } },
  EOT:            { label: "EOT (Delay)",       params: { EmployerDelay: "Employer Delay",   ContractorDelay: "Contractor Delay" } },
  Documentation:  { label: "Documentation",    params: { Records: "Records Required",        Notices: "Notices Required" } },
  RiskAllocation: { label: "Risk Allocation",  params: { EmployerRisk: "Employer Risk",      ContractorRisk: "Contractor Risk" } },
  Dispute:        { label: "Dispute",           params: { ClaimProcess: "Claim Process",     ResolutionMechanism: "Resolution Mechanism" } },
};

export default function PriceAdjustment({ id }) {
  const [data, setData] = useState(null);
  const [load, setLoad] = useState(true);
  const [err,  setErr]  = useState("");

  useEffect(() => {
    setLoad(true); setErr("");
    fetch(`https://contract-extraction-server-u2ad.onrender.com/api/price-adjustment/${id}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.error || "Failed to load");
        setData(json.priceAdjustment);
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoad(false));
  }, [id]);

  if (load) return <div className="pa-spinner"><div className="pa-loader" /></div>;
  if (err)  return <p className="pa-error">?? {err}</p>;
  if (!data) return <div className="pa-not-found">Price Adjustment analysis not available for this document.</div>;

  const scores = data.scores || {};

  const allParams = Object.values(scores).flatMap(cat => Object.values(cat));
  const total     = allParams.reduce((a, v) => a + (v === 1 ? 1 : 0), 0);
  const maxScore  = allParams.length;

  return (
    <div className="pa-root">
      <div className={`pa-banner ${data.clauseFound ? "pa-banner-found" : "pa-banner-missing"}`}>
        {data.clauseFound ? (
          <>
            <span className="pa-banner-icon">?</span>
            <div>
              <strong>Price Adjustment Clause Found</strong>
              {data.clauseReference && <span className="pa-clause-ref"> — {data.clauseReference}</span>}
              {data.clauseSummary   && <p className="pa-clause-summary">{data.clauseSummary}</p>}
            </div>
          </>
        ) : (
          <>
            <span className="pa-banner-icon">?</span>
            <strong>No Price Adjustment / Escalation Clause found in this document.</strong>
          </>
        )}
      </div>

      {data.crossReferences && data.crossReferences.length > 0 && (
        <div className="pa-crossref">
          <span className="pa-crossref-label">?? Cross-referenced Clauses:</span>
          {data.crossReferences.map((ref, i) => (
            <span key={i} className="pa-crossref-tag">{ref}</span>
          ))}
        </div>
      )}

      <div className="pa-score-summary">
        <span className="pa-score-label">Overall Score:</span>
        <span className="pa-score-value">{total} / {maxScore}</span>
        <div className="pa-score-bar-wrap">
          <div className="pa-score-bar" style={{ width: `${(total / maxScore) * 100}%` }} />
        </div>
      </div>

      <div className="pa-table-wrap">
        <table className="pa-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Parameter</th>
              <th>Present?</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => {
              const catScores = scores[catKey] || {};
              const params    = Object.entries(catInfo.params);
              return params.map(([paramKey, paramLabel], pIdx) => (
                <tr key={`${catKey}-${paramKey}`}>
                  {pIdx === 0 && (
                    <td className="pa-cat-label" rowSpan={params.length}>
                      {catInfo.label}
                    </td>
                  )}
                  <td className="pa-param-label">{paramLabel}</td>
                  <td className="pa-score-cell">
                    {catScores[paramKey] === 1
                      ? <span className="pa-yes">? Yes</span>
                      : <span className="pa-no">? No</span>
                    }
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
