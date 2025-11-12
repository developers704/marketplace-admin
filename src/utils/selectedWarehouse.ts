export function getSelectedWarehouse(): any | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('selectedWarehouse') : null;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error parsing selectedWarehouse from localStorage', err);
    return null;
  }
}

export function getSelectedWarehouseId(): string | null {
  const wh = getSelectedWarehouse();
  return wh?._id || null;
}
