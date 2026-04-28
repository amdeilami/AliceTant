import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';

const coerceValue = (value, valueType) => {
  if (valueType === 'bool') {
    return value === true || value === 'true';
  }
  if (valueType === 'int') {
    return Number(value);
  }
  return value;
};

const settingCategories = {
  Booking: ['max_appointment_duration_minutes', 'max_recurring_weeks', 'max_bookings_per_customer_per_day'],
  Announcement: ['announcement_banner_text', 'announcement_banner_visible', 'announcement_banner_severity'],
};

const settingChoices = {
  announcement_banner_severity: [
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'critical', label: 'Critical' },
  ],
};

const renderSettingInput = (setting, setSettings) => {
  const selectClass = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white';
  const updateDraft = (value) => setSettings((current) => current.map((item) => item.key === setting.key ? { ...item, draftValue: value } : item));

  if (setting.value_type === 'bool') {
    return (
      <select value={String(setting.draftValue)} onChange={(event) => updateDraft(event.target.value === 'true')} className={selectClass}>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  if (settingChoices[setting.key]) {
    return (
      <select value={setting.draftValue ?? ''} onChange={(event) => updateDraft(event.target.value)} className={selectClass}>
        {settingChoices[setting.key].map((choice) => (
          <option key={choice.value} value={choice.value}>{choice.label}</option>
        ))}
      </select>
    );
  }

  return (
    <input value={setting.draftValue ?? ''} onChange={(event) => updateDraft(event.target.value)} className={selectClass} />
  );
};

const AdminSettingsView = () => {
  const { showError, showSuccess } = useToast();
  const [settings, setSettings] = useState([]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings/');
      setSettings((response.data.results || []).map((setting) => ({
        ...setting,
        draftValue: setting.parsed_value,
      })));
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to load settings');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSetting = async (setting) => {
    try {
      await api.put(`/admin/settings/${setting.key}/`, {
        value: coerceValue(setting.draftValue, setting.value_type),
      });
      showSuccess(`Updated ${setting.key}`);
      fetchSettings();
    } catch (error) {
      showError(error.response?.data?.error || `Failed to update ${setting.key}`);
    }
  };

  const groupedSettings = Object.entries(settingCategories).map(([category, keys]) => ({
    category,
    items: settings.filter((setting) => keys.includes(setting.key)),
  })).filter((group) => group.items.length > 0);

  const uncategorizedSettings = settings.filter(
    (setting) => !Object.values(settingCategories).flat().includes(setting.key)
  );

  return (
    <div className="space-y-6">
      {groupedSettings.map((group) => (
        <div key={group.category} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.category}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{group.category === 'Booking' ? 'Limits that affect appointment creation and recurring availability.' : 'Global announcement banner controls that apply across the app.'}</p>
          </div>
          {group.items.map((setting) => (
            <div key={setting.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{setting.key}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{setting.description || 'System setting'}</p>
                </div>
                <div className="w-full lg:w-80">
                  {renderSettingInput(setting, setSettings)}
                </div>
                <button type="button" onClick={() => saveSetting(setting)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {uncategorizedSettings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Other</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Additional system settings that do not belong to a predefined category.</p>
          </div>
          {uncategorizedSettings.map((setting) => (
            <div key={setting.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{setting.key}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{setting.description || 'System setting'}</p>
                </div>
                <div className="w-full lg:w-80">
                  {renderSettingInput(setting, setSettings)}
                </div>
                <button type="button" onClick={() => saveSetting(setting)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSettingsView;