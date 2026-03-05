import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ModalContext = createContext({ openModal: () => {}, closeModal: () => {} });

export function ModalProvider({ children }) {
  const [content, setContent] = useState(null);

  const closeModal = useCallback(() => setContent(null), []);
  const openModal = useCallback((node) => setContent(() => node), []);

  const value = useMemo(() => ({ openModal, closeModal }), [openModal, closeModal]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {content ? (
        <>
          <button className="modal-overlay" onClick={closeModal} aria-label="Close modal" />
          <div className="modal-sheet">{typeof content === 'function' ? content({ closeModal }) : content}</div>
        </>
      ) : null}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
