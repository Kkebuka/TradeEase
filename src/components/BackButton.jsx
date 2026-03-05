export default function BackButton({ onClick }) {
  return (
    <button type="button" className="btn btn-secondary" style={{ width: '44px', minHeight: '44px', borderRadius: '10px', padding: 0 }} onClick={onClick} aria-label="Go back">
      <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
    </button>
  );
}
