'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export function useShowAlertModal(): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [showAlertModal, setShowAlertModal] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('showAlertModal');
    if (saved) setShowAlertModal(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('showAlertModal', JSON.stringify(showAlertModal));
  }, [showAlertModal]);

  return [showAlertModal, setShowAlertModal];
}
