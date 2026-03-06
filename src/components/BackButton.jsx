import { ArrowLeftIcon } from './Icons';

export default function BackButton({ onClick }) {
  return (
    <button type="button" className="back-button" onClick={onClick} aria-label="Go back">
      <ArrowLeftIcon className="back-button-icon" />
    </button>
  );
}
