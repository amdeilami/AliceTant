const AdminActionModal = ({
  isOpen,
  title,
  description,
  warning,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmDisabled = false,
  value,
  valueLabel,
  valuePlaceholder,
  onValueChange,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>}
          {warning && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">{warning}</div>}
        </div>
        {onValueChange && (
          <div className="px-5 py-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{valueLabel}</label>
            <textarea
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              rows="4"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              placeholder={valuePlaceholder}
            />
          </div>
        )}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={confirmDisabled} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default AdminActionModal;