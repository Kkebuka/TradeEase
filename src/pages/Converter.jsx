import { useEffect, useMemo, useState } from "react";
import BackButton from "../components/BackButton";
import { EditIcon, TrashIcon } from "../components/Icons";
import NumericInput from "../components/NumericInput";
import Tooltip from "../components/Tooltip";
import { useModal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { exportSessionPdf } from "../utils/pdf";
import { formatDate, formatNaira, generateId } from "../utils/helpers";
import { createSessionSkeleton, saveSession, getSessions } from "../utils/storage";

function calculateItem(constants, product) {
  const { dollarRate, freightUSD, clearingNGN, containerCBM } = constants;
  const { cartonPriceUSD, quantityPerCarton, cartonCBM } = product;

  const goodsValueNGN = cartonPriceUSD * dollarRate;
  const freightNGN = (cartonCBM / containerCBM) * freightUSD * dollarRate;
  const clearingPerCarton = (cartonCBM / containerCBM) * clearingNGN;
  const totalCartonCost = goodsValueNGN + freightNGN + clearingPerCarton;
  const costPerPiece = totalCartonCost / quantityPerCarton;

  return {
    goodsValueNGN,
    freightNGN,
    clearingPerCarton,
    totalCartonCost,
    costPerPiece,
  };
}
function recalculateSessionItems(constants, items) {
  return items.map(item => {
    const result = calculateItem(
      {
        dollarRate: Number(constants.dollarRate),
        freightUSD: Number(constants.freightUSD),
        clearingNGN: Number(constants.clearingNGN),
        containerCBM: Number(constants.containerCBM),
      },
      item
    );
    
    const sellingPricePerPiece = item.pricing?.sellingPricePerPiece || 0;
    const quantityPerCarton = item.quantityPerCarton || 0;
    const sellingPricePerCarton = sellingPricePerPiece * quantityPerCarton;
    const profitPerPiece = sellingPricePerPiece - result.costPerPiece;
    const profitPerCarton = sellingPricePerCarton - result.totalCartonCost;
    
    return {
      ...item,
      result,
      pricing: {
        ...item.pricing,
        sellingPricePerPiece,
        sellingPricePerCarton,
        profitPerPiece,
        profitPerCarton
      }
    };
  });
}

export default function Converter({ user, onNavigate, editSessionId }) {
  const { openModal } = useModal();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [session, setSession] = useState(createSessionSkeleton(""));
  
  useEffect(() => {
    if (editSessionId) {
      const allSessions = getSessions();
      const found = allSessions.find(s => s.id === editSessionId);
      if (found) {
        setSession(found);
        setStep(5);
      } else {
        showToast("Calculation session not found", "error");
        onNavigate("home");
      }
    }
  }, [editSessionId]);
  const [product, setProduct] = useState({
    itemName: "",
    cartonPriceUSD: "",
    quantityPerCarton: "",
    cartonCBM: "",
  });
  const [previewResult, setPreviewResult] = useState(null);
  const [profitPrice, setProfitPrice] = useState("");
  const [errors, setErrors] = useState({});
  const hasProgress =
    !!session.name ||
    Object.values(session.constants).some(Boolean) ||
    session.items.length > 0 ||
    !!product.itemName ||
    !!product.cartonPriceUSD ||
    !!product.quantityPerCarton ||
    !!product.cartonCBM ||
    !!profitPrice ||
    !!previewResult;

  const clearError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const totalInvestment = useMemo(
    () =>
      session.items.reduce((sum, item) => sum + item.result.totalCartonCost, 0),
    [session.items],
  );
  const computedPricing = useMemo(() => {
    if (!previewResult) {
      return {
        sellingPricePerPiece: 0,
        sellingPricePerCarton: 0,
        profitPerPiece: 0,
        profitPerCarton: 0,
        margin: 0,
        breakEvenQty: 0,
      };
    }
    const sellingPricePerPiece = Number(profitPrice || 0);
    const quantityPerCarton = Number(product.quantityPerCarton || 0);
    const sellingPricePerCarton = sellingPricePerPiece * quantityPerCarton;
    const profitPerPiece = sellingPricePerPiece - previewResult.costPerPiece;
    const profitPerCarton =
      sellingPricePerCarton - previewResult.totalCartonCost;
    const margin =
      sellingPricePerPiece > 0
        ? (profitPerPiece / sellingPricePerPiece) * 100
        : 0;
    const breakEvenQty =
      sellingPricePerPiece > 0
        ? Math.ceil(previewResult.totalCartonCost / sellingPricePerPiece)
        : 0;

    return {
      sellingPricePerPiece,
      sellingPricePerCarton,
      profitPerPiece,
      profitPerCarton,
      margin,
      breakEvenQty,
    };
  }, [previewResult, product.quantityPerCarton, profitPrice]);

  const validateConstants = () => {
    const nextErrors = {};
    if (!session.constants.dollarRate)
      nextErrors.dollarRate = "Dollar rate is required";
    if (!session.constants.freightUSD)
      nextErrors.freightUSD = "Freight cost is required";
    if (!session.constants.clearingNGN)
      nextErrors.clearingNGN = "Clearing fee is required";
    if (!session.constants.containerCBM)
      nextErrors.containerCBM = "Container CBM is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const runCalculation = () => {
    const nextErrors = {};
    if (!product.itemName?.trim())
      nextErrors.itemName = "Item name is required";
    if (!product.cartonPriceUSD)
      nextErrors.cartonPriceUSD = "Carton price is required";
    if (!product.quantityPerCarton)
      nextErrors.quantityPerCarton = "Quantity is required";
    if (!product.cartonCBM) nextErrors.cartonCBM = "Carton CBM is required";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const result = calculateItem(
      {
        dollarRate: Number(session.constants.dollarRate),
        freightUSD: Number(session.constants.freightUSD),
        clearingNGN: Number(session.constants.clearingNGN),
        containerCBM: Number(session.constants.containerCBM),
      },
      {
        cartonPriceUSD: Number(product.cartonPriceUSD),
        quantityPerCarton: Number(product.quantityPerCarton),
        cartonCBM: Number(product.cartonCBM),
      },
    );

    setPreviewResult(result);
    setStep(4);
  };

  const addOrUpdateItem = (editingId = null) => {
    if (!previewResult) return false;
    const sellingPricePerPiece = Number(profitPrice || 0);
    if (sellingPricePerPiece <= 0) {
      setErrors((prev) => ({
        ...prev,
        sellingPricePerPiece:
          "Selling price per piece is required to save this item",
      }));
      return false;
    }
    const item = {
      id: editingId || generateId("item"),
      itemName: product.itemName.trim(),
      cartonPriceUSD: Number(product.cartonPriceUSD),
      quantityPerCarton: Number(product.quantityPerCarton),
      cartonCBM: Number(product.cartonCBM),
      result: previewResult,
      pricing: {
        sellingPricePerPiece,
        sellingPricePerCarton: computedPricing.sellingPricePerCarton,
        profitPerPiece: computedPricing.profitPerPiece,
        profitPerCarton: computedPricing.profitPerCarton,
      },
    };

    setSession((prev) => {
      if (!editingId) return { ...prev, items: [...prev.items, item] };
      return {
        ...prev,
        items: prev.items.map((row) => (row.id === editingId ? item : row)),
      };
    });

    setProduct({
      itemName: "",
      cartonPriceUSD: "",
      quantityPerCarton: "",
      cartonCBM: "",
    });
    setProfitPrice("");
    setPreviewResult(null);
    return true;
  };

  const openDeleteItem = (itemId, itemName) => {
    openModal(({ closeModal: close }) => (
      <div className="stack">
        <h3>Remove {itemName}?</h3>
        <p className="muted">This cannot be undone.</p>
        <button
          className="btn btn-danger"
          onClick={() => {
            setSession((prev) => ({
              ...prev,
              items: prev.items.filter((item) => item.id !== itemId),
            }));
            showToast("Item deleted", "warning");
            close();
          }}
        >
          Delete
        </button>
        <button className="btn btn-secondary" onClick={close}>
          Cancel
        </button>
      </div>
    ));
  };

  const openEditItem = (item) => {
    setProduct({
      itemName: item.itemName,
      cartonPriceUSD: item.cartonPriceUSD,
      quantityPerCarton: item.quantityPerCarton,
      cartonCBM: item.cartonCBM,
    });
    setProfitPrice(item.pricing?.sellingPricePerPiece || "");
    setPreviewResult(item.result);
    setStep(4);
    openModal(({ closeModal: close }) => (
      <div className="stack">
        <h3>Update this item?</h3>
        <button
          className="btn btn-primary"
          onClick={() => {
            const saved = addOrUpdateItem(item.id);
            if (!saved) return;
            close();
            setStep(5);
            showToast("Item updated ✓");
          }}
        >
          Save Update
        </button>
        <button className="btn btn-secondary" onClick={close}>
          Cancel
        </button>
      </div>
    ));
  };

  const openPreviewConfirmation = () => {
    openModal(({ closeModal: close }) => (
      <div className="stack">
        <h3>Done adding products?</h3>
        <p className="muted">
          Your current item has been saved. Preview all items now, or go back
          and add more products.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            close();
            setStep(5);
          }}
        >
          Yes, Preview Items
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            close();
            setStep(3);
          }}
        >
          Continue Adding
        </button>
      </div>
    ));
  };

  const openExitConfirmation = () => {
    openModal(({ closeModal: close }) => (
      <div className="stack">
        <h3>Leave this calculator?</h3>
        <p className="muted">
          Your current progress will stay here only if you finish by printing
          and saving the calculation.
        </p>
        <button
          className="btn btn-danger"
          onClick={() => {
            close();
            onNavigate("home");
          }}
        >
          Leave Calculator
        </button>
        <button className="btn btn-secondary" onClick={close}>
          Stay Here
        </button>
      </div>
    ));
  };

  const handleBack = () => {
    if (step === 5) {
      if (editSessionId) {
        onNavigate("home");
        return;
      }
      setStep(3);
      return;
    }
    if (step === 4) {
      setStep(3);
      return;
    }
    if (step === 3) {
      setStep(2);
      return;
    }
    if (step === 2) {
      if (session.items.length > 0) {
        setStep(5);
        return;
      }
      setStep(1);
      return;
    }
    if (hasProgress) {
      openExitConfirmation();
      return;
    }
    onNavigate("home");
  };

  const printSaveAndHome = () => {
    exportSessionPdf(session, user);
    saveSession(session);
    showToast("Calculation printed and saved ✓");
    onNavigate("home");
  };

  return (
    <main className="stack page-anim-enter">
      <header className="page-header">
        <div className="row">
          <BackButton onClick={handleBack} />
          <h2 className="page-title">Import Calculator</h2>
        </div>
      </header>

      {step === 1 ? (
        <section className="card stack">
          <h3>Session Setup</h3>
          <div className="field">
            <label className="field-label">Session Name (optional)</label>
            <input
              className="field-input"
              placeholder="e.g. March Shipment"
              onChange={(e) =>
                setSession((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <small className="muted">
              Helps you identify this calculation later.
            </small>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!session.name)
                setSession((prev) => ({
                  ...prev,
                  name: `Shipment · ${new Date().toLocaleDateString("en-NG")}`,
                }));
              setStep(2);
            }}
          >
            Set Container Details →
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="card stack">
          <p className="muted">
            Enter details that apply to the whole container.
          </p>
          {[
            [
              "dollarRate",
              "Dollar Rate Today (₦)",
              "How much one dollar costs today.",
            ],
            [
              "freightUSD",
              "Total Freight Cost ($)",
              "Whole-container shipping cost in USD.",
            ],
            [
              "clearingNGN",
              "Clearing Fee (₦)",
              "Customs and port clearing charges.",
            ],
            [
              "containerCBM",
              "Container Size (CBM)",
              "Total container volume in cubic meters.",
            ],
          ].map(([key, label, tip]) => (
            <div className="field" key={key}>
              <label className="field-label row-between">
                <span>{label}</span>
                <Tooltip text={tip} />
              </label>
              <NumericInput
                value={session.constants[key]}
                allowDecimal
                onValueChange={(value) => {
                  clearError(key);
                  setSession((prev) => ({
                    ...prev,
                    constants: { ...prev.constants, [key]: value },
                  }));
                }}
              />
              {errors[key] ? (
                <small className="error">{errors[key]}</small>
              ) : null}
            </div>
          ))}
          <button
            className="btn btn-primary"
            onClick={() => {
              if (validateConstants()) {
                if (session.items.length > 0) {
                  const updatedItems = recalculateSessionItems(session.constants, session.items);
                  setSession((prev) => ({ ...prev, items: updatedItems }));
                  setStep(5);
                } else {
                  setStep(3);
                }
              }
            }}
          >
            {session.items.length > 0 ? "Recalculate & Preview →" : "Continue to Products →"}
          </button>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="stack">
          <div className="card">
            <div className="row-between">
              <strong>Constants Summary</strong>
              <button
                className="btn btn-secondary"
                style={{
                  width: "auto",
                  padding: "8px 10px",
                  minHeight: "auto",
                }}
                onClick={() => setStep(2)}
              >
                Edit
              </button>
            </div>
            <small className="muted">
              Rate {formatNaira(session.constants.dollarRate)} · Freight $
              {session.constants.freightUSD} · Clearing{" "}
              {formatNaira(session.constants.clearingNGN)} ·{" "}
              {session.constants.containerCBM} CBM
            </small>
          </div>
          <section className="card stack">
            <h3>Add Product</h3>
            {[
              [
                "itemName",
                "Item Name or Code",
                "text",
                "e.g. Phone Charger 65W",
              ],
              ["cartonPriceUSD", "Carton Price ($)", "number", ""],
              [
                "quantityPerCarton",
                "Total quantity in carton(pcs)",
                "number",
                "",
              ],
              ["cartonCBM", "CBM of carton(s)", "number", ""],
            ].map(([key, label, type, placeholder]) => (
              <div className="field" key={key}>
                <label className="field-label">{label}</label>
                {type === "number" ? (
                  <NumericInput
                    value={product[key]}
                    allowDecimal={key !== "quantityPerCarton"}
                    placeholder={placeholder}
                    onValueChange={(value) => {
                      setErrors({});
                      setProduct((prev) => ({ ...prev, [key]: value }));
                    }}
                  />
                ) : (
                  <input
                    className="field-input"
                    type={type}
                    placeholder={placeholder}
                    value={product[key]}
                    onChange={(e) => {
                      setErrors({});
                      setProduct((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }));
                    }}
                  />
                )}
                {errors[key] ? (
                  <small className="error">{errors[key]}</small>
                ) : null}
              </div>
            ))}
            <button className="btn btn-primary" onClick={runCalculation}>
              Calculate →
            </button>
          </section>
        </section>
      ) : null}

      {step === 4 && previewResult ? (
        <section className="card stack">
          <div className="row-between">
            <h3>{product.itemName.toUpperCase()}</h3>
            <button
              className="icon-action"
              aria-label="Edit this item"
              onClick={() => setStep(3)}
            >
              <EditIcon className="action-icon" />
            </button>
          </div>
          <div className="row-between">
            <span>Total Carton Cost</span>
            <strong className="money">
              {formatNaira(previewResult.totalCartonCost)}
            </strong>
          </div>
          <div className="row-between">
            <span>Cost per Piece</span>
            <strong className="money">
              {formatNaira(previewResult.costPerPiece)}
            </strong>
          </div>

          <section className="card stack" style={{ padding: 14 }}>
            <div className="row-between">
              <strong>Profit Estimator</strong>
              <span className="badge offline">Required</span>
            </div>
            <div className="field">
              <label className="field-label">
                Your selling price per piece (₦)
              </label>
              <NumericInput
                className="field-input field-input-prominent"
                value={profitPrice}
                allowDecimal
                onValueChange={(value) => {
                  clearError("sellingPricePerPiece");
                  setProfitPrice(value);
                }}
              />
              {errors.sellingPricePerPiece ? (
                <small className="error">{errors.sellingPricePerPiece}</small>
              ) : null}
            </div>
            {profitPrice ? (
              <div className="stack">
                <div className="row-between">
                  <small className="muted">
                    Profit per piece:{" "}
                    {formatNaira(computedPricing.profitPerPiece)}
                  </small>
                  <small className="muted">
                    Margin: {computedPricing.margin.toFixed(1)}%
                  </small>
                </div>
                <small className="muted">
                  Total carton selling price:{" "}
                  {formatNaira(computedPricing.sellingPricePerCarton)}
                </small>
                <small className="muted">
                  Profit for carton(s):{" "}
                  {formatNaira(computedPricing.profitPerCarton)}
                </small>
              </div>
            ) : (
              <small className="muted estimator-note">
                Enter selling price to compute margin and profit instantly.
              </small>
            )}
          </section>

          <button
            className="btn btn-primary"
            onClick={() => {
              const saved = addOrUpdateItem();
              if (!saved) return;
              showToast("Item added ✓");
              setStep(3);
            }}
          >
            Add Another Item
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              const saved = addOrUpdateItem();
              if (!saved) return;
              openPreviewConfirmation();
            }}
          >
            Preview All Items →
          </button>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="card stack">
          <div className="row-between">
            <div className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <h3 style={{ fontSize: '1.25rem' }}>{session.name || "Calculation Details"}</h3>
              <small className="muted">{formatDate(session.createdAt)}</small>
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: "auto", minHeight: 36, padding: "6px 12px", fontSize: 13 }}
              onClick={() => setStep(2)}
            >
              Edit Rates
            </button>
          </div>
          <div className="card dark-paper" style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            <div>
              <small className="muted" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Dollar Rate</small>
              <strong>$1 = {formatNaira(session.constants.dollarRate)}</strong>
            </div>
            <div>
              <small className="muted" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Freight Cost</small>
              <strong>${session.constants.freightUSD}</strong>
            </div>
            <div>
              <small className="muted" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Clearing Fee</small>
              <strong>{formatNaira(session.constants.clearingNGN)}</strong>
            </div>
            <div>
              <small className="muted" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Container Size</small>
              <strong>{session.constants.containerCBM} CBM</strong>
            </div>
          </div>
          {session.items.length ? (
            session.items.map((item, index) => (
              <div key={item.id} className="card" style={{ padding: 14 }}>
                <div className="row-between">
                  <strong>
                    {index + 1}. {item.itemName}
                  </strong>
                  <div className="inline-tools">
                    <button
                      className="icon-action"
                      aria-label="Edit item"
                      onClick={() => openEditItem(item)}
                    >
                      <EditIcon className="action-icon" />
                    </button>
                    <button
                      className="icon-action danger"
                      aria-label="Delete item"
                      onClick={() => openDeleteItem(item.id, item.itemName)}
                    >
                      <TrashIcon className="action-icon" />
                    </button>
                  </div>
                </div>
                <small className="muted">
                  Cost/Carton: {formatNaira(item.result.totalCartonCost)} ·
                  Cost/Piece: {formatNaira(item.result.costPerPiece)}
                </small>
                <small className="muted">
                  Selling/Carton:{" "}
                  {formatNaira(item.pricing?.sellingPricePerCarton || 0)} ·
                  Profit/Carton:{" "}
                  {formatNaira(item.pricing?.profitPerCarton || 0)}
                </small>
              </div>
            ))
          ) : (
            <small className="muted">No items yet.</small>
          )}

          <div className="row-between">
            <strong>Total Investment</strong>
            <strong className="money">{formatNaira(totalInvestment)}</strong>
          </div>

          <button className="btn btn-secondary" onClick={() => setStep(3)}>
            Add More Items
          </button>
          <button className="btn btn-primary" onClick={printSaveAndHome}>
            Download and Save
          </button>
        </section>
      ) : null}
    </main>
  );
}
