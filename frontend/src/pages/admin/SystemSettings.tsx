import React, { useState } from 'react';
import { Save, ArrowRight, Bell, Lock, Globe, Database, Mail } from 'lucide-react';

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  // These would normally be loaded from backend and saved on form submission
  const [formData, setFormData] = useState({
    systemName: 'Education Management System',
    supportEmail: 'support@education.com',
    timeZone: 'UTC+3',
    dateFormat: 'MM/DD/YYYY',
    defaultLanguage: 'English',
    maintenanceMode: false,
    emailNotifications: true,
    smsNotifications: false,
    autoBackup: true,
    backupFrequency: 'daily',
    maxFileSize: 5,
    maxStudentsPerClass: 30,
    maxTeachersPerSchool: 50
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs separately
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save to backend
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure your education system</p>
        </div>
        <button 
          onClick={handleSubmit}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="card">
        <div className="p-0 flex flex-col md:flex-row">
          {/* Settings Navigation */}
          <div className="w-full md:w-64 bg-gray-50 p-4 md:border-r border-gray-200">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                  activeTab === 'general'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Globe className="mr-3 h-5 w-5" />
                General
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                  activeTab === 'notifications'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Bell className="mr-3 h-5 w-5" />
                Notifications
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                  activeTab === 'security'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Lock className="mr-3 h-5 w-5" />
                Security
              </button>

              <button
                onClick={() => setActiveTab('database')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                  activeTab === 'database'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Database className="mr-3 h-5 w-5" />
                Database & Backup
              </button>

              <button
                onClick={() => setActiveTab('email')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                  activeTab === 'email'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Mail className="mr-3 h-5 w-5" />
                Email Configuration
              </button>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-6">
            <form onSubmit={handleSubmit}>
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="systemName" className="block text-sm font-medium text-gray-700">
                        System Name
                      </label>
                      <input
                        type="text"
                        id="systemName"
                        name="systemName"
                        value={formData.systemName}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700">
                        Support Email
                      </label>
                      <input
                        type="email"
                        id="supportEmail"
                        name="supportEmail"
                        value={formData.supportEmail}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="timeZone" className="block text-sm font-medium text-gray-700">
                        Time Zone
                      </label>
                      <select
                        id="timeZone"
                        name="timeZone"
                        value={formData.timeZone}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="UTC-12">UTC-12:00</option>
                        <option value="UTC-11">UTC-11:00</option>
                        <option value="UTC-10">UTC-10:00</option>
                        <option value="UTC-9">UTC-09:00</option>
                        <option value="UTC-8">UTC-08:00</option>
                        <option value="UTC-7">UTC-07:00</option>
                        <option value="UTC-6">UTC-06:00</option>
                        <option value="UTC-5">UTC-05:00</option>
                        <option value="UTC-4">UTC-04:00</option>
                        <option value="UTC-3">UTC-03:00</option>
                        <option value="UTC-2">UTC-02:00</option>
                        <option value="UTC-1">UTC-01:00</option>
                        <option value="UTC">UTC±00:00</option>
                        <option value="UTC+1">UTC+01:00</option>
                        <option value="UTC+2">UTC+02:00</option>
                        <option value="UTC+3">UTC+03:00</option>
                        <option value="UTC+4">UTC+04:00</option>
                        <option value="UTC+5">UTC+05:00</option>
                        <option value="UTC+6">UTC+06:00</option>
                        <option value="UTC+7">UTC+07:00</option>
                        <option value="UTC+8">UTC+08:00</option>
                        <option value="UTC+9">UTC+09:00</option>
                        <option value="UTC+10">UTC+10:00</option>
                        <option value="UTC+11">UTC+11:00</option>
                        <option value="UTC+12">UTC+12:00</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700">
                        Date Format
                      </label>
                      <select
                        id="dateFormat"
                        name="dateFormat"
                        value={formData.dateFormat}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="defaultLanguage" className="block text-sm font-medium text-gray-700">
                        Default Language
                      </label>
                      <select
                        id="defaultLanguage"
                        name="defaultLanguage"
                        value={formData.defaultLanguage}
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Arabic">Arabic</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="maintenanceMode"
                          checked={formData.maintenanceMode}
                          onChange={handleChange}
                          className="form-checkbox h-5 w-5"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Maintenance Mode</span>
                      </label>
                      <p className="text-sm text-gray-500">
                        Only administrators will be able to access the system
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="emailNotifications"
                          checked={formData.emailNotifications}
                          onChange={handleChange}
                          className="form-checkbox h-5 w-5"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Email Notifications</span>
                      </label>
                      <p className="text-sm text-gray-500 pl-7">
                        Send email notifications for important events
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="smsNotifications"
                          checked={formData.smsNotifications}
                          onChange={handleChange}
                          className="form-checkbox h-5 w-5"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">SMS Notifications</span>
                      </label>
                      <p className="text-sm text-gray-500 pl-7">
                        Send SMS notifications for important events
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Settings Tabs */}
              {(activeTab === 'security' || activeTab === 'database' || activeTab === 'email') && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {activeTab === 'security' && 'Security Settings'}
                    {activeTab === 'database' && 'Database & Backup Settings'}
                    {activeTab === 'email' && 'Email Configuration'}
                  </h3>
                  <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">This section is under development</p>
                      <ArrowRight className="h-10 w-10 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500 mt-4">Coming in future updates</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
